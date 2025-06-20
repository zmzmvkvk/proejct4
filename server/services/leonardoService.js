const axios = require("axios");

class LeonardoService {
  constructor() {
    this.apiKey = process.env.LEONARDO_API_KEY;
    this.baseURL = "https://cloud.leonardo.ai/api/rest/v1";
  }

  // 재시도 로직이 있는 HTTP 요청 함수
  async makeRequestWithRetry(requestFn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        const isRateLimited = error.response?.status === 429;
        const isServerError = error.response?.status >= 500;

        if ((isRateLimited || isServerError) && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // 지수 백오프
          const jitter = Math.random() * 1000; // 랜덤 지터 추가
          const totalDelay = delay + jitter;

          console.log(
            `⏳ API 요청 실패 (${error.response?.status}), ${totalDelay.toFixed(
              0
            )}ms 후 재시도 (${attempt}/${maxRetries})`
          );

          await new Promise((resolve) => setTimeout(resolve, totalDelay));
          continue;
        }

        throw error;
      }
    }
  }

  async uploadReferenceImage(imageUrl) {
    if (!imageUrl) {
      throw new Error("Image URL is missing.");
    }

    const response = await axios.post(
      `${this.baseURL}/images`,
      { url: imageUrl },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.data?.uploadImage?.id) {
      throw new Error("Failed to get image ID from Leonardo upload response.");
    }

    return response.data.uploadImage.id;
  }

  async uploadTrainingImage(datasetId, file) {
    // 1. Leonardo.ai에 이미지 업로드 초기화 (Presigned URL 받기)
    const initUploadResponse = await axios.post(
      `${this.baseURL}/datasets/${datasetId}/upload`,
      { extension: file.mimetype.split("/")[1] },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    const uploadData = initUploadResponse.data?.uploadDatasetImage;
    if (
      !uploadData ||
      !uploadData.url ||
      !uploadData.fields ||
      !uploadData.id
    ) {
      throw new Error("Failed to get presigned URL from Leonardo.ai.");
    }

    const { url: presignedUrl, fields: rawFields, id: imageId } = uploadData;
    const fields = JSON.parse(rawFields);

    // 2. Presigned URL을 사용하여 S3에 이미지 업로드
    const FormData = require("form-data");
    const formData = new FormData();
    for (const key in fields) {
      formData.append(key, fields[key]);
    }
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const s3UploadResponse = await axios.post(presignedUrl, formData, {
      headers: formData.getHeaders(),
    });

    if (s3UploadResponse.status !== 200 && s3UploadResponse.status !== 204) {
      throw new Error(
        `Failed to upload image to S3: ${s3UploadResponse.statusText}`
      );
    }

    return imageId;
  }

  async generateImage(payload) {
    console.log("🎨 [LEONARDO SERVICE DEBUG] 이미지 생성 시작");
    console.log(
      "📦 [LEONARDO SERVICE DEBUG] 전송할 페이로드:",
      JSON.stringify(payload, null, 2)
    );

    const response = await axios.post(`${this.baseURL}/generations`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      timeout: 30000, // 초기 요청은 30초 타임아웃
    });

    console.log(
      "📨 [LEONARDO SERVICE DEBUG] Leonardo API 초기 응답:",
      JSON.stringify(response.data, null, 2)
    );

    const generationId = response.data.sdGenerationJob.generationId;
    console.log("🆔 [LEONARDO SERVICE DEBUG] Generation ID:", generationId);

    // 생성 완료될 때까지 폴링 (최대 3분)
    let generatedImageUrl = null;
    const maxPollingAttempts = 36; // 3분 (5초 * 36 = 180초)

    for (let i = 0; i < maxPollingAttempts; i++) {
      console.log(
        `⏳ [LEONARDO SERVICE DEBUG] 폴링 시도 ${i + 1}/${maxPollingAttempts}`
      );

      // 첫 번째 폴링은 10초 후, 그 다음은 5초 간격
      const waitTime = i === 0 ? 10000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      try {
        const pollResponse = await axios.get(
          `${this.baseURL}/generations/${generationId}`,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
            timeout: 15000, // 폴링 요청은 15초 타임아웃
          }
        );

        console.log(
          `📊 [LEONARDO SERVICE DEBUG] 폴링 응답 ${i + 1}:`,
          JSON.stringify(pollResponse.data, null, 2)
        );

        const jobStatus = pollResponse.data.generations_by_pk;
        if (jobStatus && jobStatus.status === "COMPLETE") {
          if (
            jobStatus.generated_images &&
            jobStatus.generated_images.length > 0
          ) {
            generatedImageUrl = jobStatus.generated_images[0].url;
            console.log("✅ [LEONARDO SERVICE DEBUG] 이미지 생성 완료!");
            console.log(
              "🖼️ [LEONARDO SERVICE DEBUG] 생성된 이미지 URL:",
              generatedImageUrl
            );

            // 실제 사용된 요소들 확인
            const generatedImage = jobStatus.generated_images[0];
            console.log(
              "🎯 [LEONARDO SERVICE DEBUG] 생성된 이미지 메타데이터:",
              {
                url: generatedImage.url,
                likelyPrompt: generatedImage.likelyPrompt,
                modelId: generatedImage.modelId,
                elements: generatedImage.elements || "없음",
              }
            );
            break;
          } else {
            console.warn(
              "⚠️ [LEONARDO SERVICE DEBUG] 완료되었지만 이미지가 없음"
            );
            throw new Error(
              "이미지 생성이 완료되었지만 결과 이미지를 찾을 수 없습니다."
            );
          }
        } else if (jobStatus && jobStatus.status === "FAILED") {
          console.error(
            "❌ [LEONARDO SERVICE DEBUG] 이미지 생성 실패:",
            jobStatus
          );
          throw new Error(`이미지 생성이 실패했습니다: ${jobStatus.status}`);
        } else {
          console.log(
            `🔄 [LEONARDO SERVICE DEBUG] 현재 상태: ${
              jobStatus?.status || "알 수 없음"
            }`
          );
        }
      } catch (pollError) {
        console.warn(
          `⚠️ [LEONARDO SERVICE DEBUG] 폴링 에러 (${
            i + 1
          }/${maxPollingAttempts}):`,
          pollError.message
        );

        // 마지막 시도가 아니면 계속 진행
        if (i < maxPollingAttempts - 1) {
          continue;
        } else {
          throw pollError;
        }
      }
    }

    if (!generatedImageUrl) {
      console.error("⏰ [LEONARDO SERVICE DEBUG] 이미지 생성 시간 초과");
      throw new Error("이미지 생성이 시간 초과되었습니다. 다시 시도해주세요.");
    }

    return generatedImageUrl;
  }

  async getUserInfo() {
    const response = await axios.get(`${this.baseURL}/me`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    return response.data;
  }

  async getUserElements(userId) {
    const response = await axios.get(
      `${this.baseURL}/elements/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    console.log(
      "🔍 Leonardo API 원본 응답 (getUserElements):",
      JSON.stringify(response.data, null, 2)
    );
    console.log("📦 User LoRAs 배열:", response.data.user_loras);

    // 각 element의 상세 정보 로그
    if (response.data.user_loras) {
      response.data.user_loras.forEach((element, index) => {
        console.log(
          `🎯 Element ${index + 1} 상세:`,
          JSON.stringify(element, null, 2)
        );
      });
    }

    return response.data.user_loras || [];
  }

  async createElement(elementData) {
    const response = await axios.post(`${this.baseURL}/elements`, elementData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    return response.data;
  }

  async deleteElement(elementId) {
    const response = await axios.delete(
      `${this.baseURL}/elements/${elementId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );
    return response.data;
  }

  async getElementStatus(elementId) {
    try {
      console.log(`🔍 Element ${elementId} 상태 조회 중...`);

      const response = await axios.get(
        `${this.baseURL}/elements/${elementId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      console.log(
        `📊 Element ${elementId} API 응답:`,
        JSON.stringify(response.data, null, 2)
      );

      // user_elements 배열이 존재하고 비어있지 않은 경우
      if (
        response.data.user_elements &&
        response.data.user_elements.length > 0
      ) {
        const element = response.data.user_elements[0];
        console.log(
          `✅ Element ${elementId} 상태: ${element.status || "UNKNOWN"}`
        );
        return element;
      }

      // user_elements가 없거나 비어있는 경우 (Processing 중일 가능성)
      console.log(
        `⚠️ Element ${elementId}: user_elements 배열이 비어있음 (Processing 중일 수 있음)`
      );

      // 기본 상태 객체 반환
      return {
        id: elementId,
        status: "PROCESSING",
        name: `Element ${elementId}`,
        message: "Element is still processing",
      };
    } catch (error) {
      console.error(
        `❌ Element ${elementId} 상태 조회 실패:`,
        error.response?.data || error.message
      );

      // 404 에러인 경우 (삭제되었거나 존재하지 않는 경우)
      if (error.response?.status === 404) {
        return {
          id: elementId,
          status: "NOT_FOUND",
          name: `Element ${elementId}`,
          message: "Element not found",
        };
      }

      throw error;
    }
  }

  async getElementDetails(elementId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/elements/${elementId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      console.log(
        `🔍 Leonardo Element ${elementId} 전체 응답:`,
        JSON.stringify(response.data, null, 2)
      );

      // user_elements 배열에서 첫 번째 element 확인
      if (
        response.data.user_elements &&
        response.data.user_elements.length > 0
      ) {
        const elementDetail = response.data.user_elements[0];
        console.log(
          `📋 Element ${elementId} 상세 정보:`,
          JSON.stringify(elementDetail, null, 2)
        );

        // 가능한 이미지 URL 필드들 확인
        const possibleImageFields = [
          "imageUrl",
          "image_url",
          "thumbnailUrl",
          "thumbnail_url",
          "previewImage",
          "preview_image",
          "coverImage",
          "cover_image",
          "sampleImage",
          "sample_image",
          "url",
          "image",
        ];

        console.log(`🖼️ Element ${elementId}의 이미지 관련 필드들:`);
        possibleImageFields.forEach((field) => {
          if (elementDetail[field]) {
            console.log(`  - ${field}: ${elementDetail[field]}`);
          }
        });

        // Dataset 관련 필드들 확인
        const possibleDatasetFields = [
          "datasetId",
          "dataset_id",
          "trainingDatasetId",
          "training_dataset_id",
          "sourceDatasetId",
          "source_dataset_id",
        ];

        console.log(`🗂️ Element ${elementId}의 Dataset 관련 필드들:`);
        possibleDatasetFields.forEach((field) => {
          if (elementDetail[field]) {
            console.log(`  - ${field}: ${elementDetail[field]}`);
          }
        });

        return elementDetail;
      }

      return response.data;
    } catch (error) {
      console.error(
        `Failed to get element ${elementId} details:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getUserDatasets(userId) {
    try {
      const response = await axios.get(`${this.baseURL}/datasets`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      console.log(
        "🔍 Leonardo API 원본 응답 (getUserDatasets):",
        JSON.stringify(response.data, null, 2)
      );
      return response.data.datasets || [];
    } catch (error) {
      console.error(
        "Failed to get user datasets:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getDatasetById(datasetId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/datasets/${datasetId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      console.log(
        `🔍 Dataset ${datasetId} 상세 정보:`,
        JSON.stringify(response.data, null, 2)
      );
      return response.data.datasets_by_pk || null;
    } catch (error) {
      console.error(
        `Failed to get dataset ${datasetId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getDatasetImages(datasetId) {
    try {
      // Dataset 정보에 이미지 정보가 포함되어 있는지 확인
      const dataset = await this.getDatasetById(datasetId);

      if (dataset && dataset.dataset_images) {
        console.log(
          `📸 Dataset ${datasetId}의 이미지들:`,
          dataset.dataset_images
        );
        return dataset.dataset_images;
      }

      return [];
    } catch (error) {
      console.error(
        `Failed to get dataset ${datasetId} images:`,
        error.response?.data || error.message
      );
      return [];
    }
  }

  async createDataset(name, description) {
    console.log(`📁 데이터셋 생성 시작: ${name}`);

    const response = await this.makeRequestWithRetry(
      () =>
        axios.post(
          `${this.baseURL}/datasets`,
          { name, description },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
          }
        ),
      3, // 최대 3번 재시도
      2000 // 2초 기본 지연
    );

    console.log(`✅ 데이터셋 생성 성공: ${name}`);
    return response.data;
  }
}

module.exports = new LeonardoService();
