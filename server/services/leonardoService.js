const axios = require("axios");

class LeonardoService {
  constructor() {
    this.apiKey = process.env.LEONARDO_API_KEY;
    this.baseURL = "https://cloud.leonardo.ai/api/rest/v1";
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
    if (!uploadData || !uploadData.url || !uploadData.fields || !uploadData.id) {
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
      throw new Error(`Failed to upload image to S3: ${s3UploadResponse.statusText}`);
    }

    return imageId;
  }

  async generateImage(payload) {
    const response = await axios.post(
      `${this.baseURL}/generations`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    const generationId = response.data.sdGenerationJob.generationId;

    // 생성 완료될 때까지 폴링
    let generatedImageUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const pollResponse = await axios.get(
        `${this.baseURL}/generations/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      
      const jobStatus = pollResponse.data.generations_by_pk;
      if (jobStatus && jobStatus.status === "COMPLETE") {
        generatedImageUrl = jobStatus.generated_images[0].url;
        break;
      }
    }

    if (!generatedImageUrl) {
      throw new Error("이미지 생성이 시간 초과되었거나 실패했습니다.");
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
    return response.data.user_loras || [];
  }

  async createElement(elementData) {
    const response = await axios.post(
      `${this.baseURL}/elements`,
      elementData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );
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
    const response = await axios.get(
      `${this.baseURL}/elements/${elementId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );
    return response.data.user_elements[0] || null;
  }

  async createDataset(name, description) {
    const response = await axios.post(
      `${this.baseURL}/datasets`,
      { name, description },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );
    return response.data;
  }
}

module.exports = new LeonardoService();