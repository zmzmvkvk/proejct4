import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 이미지 생성은 시간이 오래 걸릴 수 있으므로 60초로 설정
  headers: {
    "Content-Type": "application/json",
  },
});

// 재시도 로직을 가진 API 요청 함수
const makeRequestWithRetry = async (
  requestFn,
  maxRetries = 3,
  baseDelay = 2000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      const isRateLimited = error.response?.status === 429;
      const isServerError = error.response?.status >= 500;

      if ((isRateLimited || isServerError) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 지수 백오프
        const jitter = Math.random() * 1000; // 랜덤 지터
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
};

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase();
    const url = config.url;
    console.log(`🚀 [Asset API Request] ${method} ${url}`);

    // 요청 시작 시간 기록
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    console.error("❌ [Asset API Request Error]", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    const status = response.status;
    const url = response.config.url;

    console.log(`✅ [Asset API Response] ${status} ${url} (${duration}ms)`);

    return response;
  },
  (error) => {
    const duration = error.config?.metadata?.startTime
      ? new Date() - error.config.metadata.startTime
      : 0;
    const status = error.response?.status || "Network Error";
    const url = error.config?.url || "Unknown";

    console.error(`❌ [Asset API Error] ${status} ${url} (${duration}ms)`, {
      error: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

// 에러 처리 헬퍼
const handleApiError = (error, defaultMessage) => {
  console.error("API Error:", error);
  const message =
    error.response?.data?.error || error.message || defaultMessage;
  throw new Error(message);
};

// 응답 데이터 추출 헬퍼
const extractResponseData = (response) => {
  return response.data;
};

// 전역 에셋 관리
export const fetchAssets = async () => {
  try {
    const response = await api.get("/assets");
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "에셋 목록을 불러오는데 실패했습니다.");
  }
};

export const toggleAssetFavorite = async (assetId) => {
  if (!assetId) {
    throw new Error("에셋 ID가 필요합니다.");
  }

  try {
    const response = await api.post(`/assets/${assetId}/toggle-favorite`);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "즐겨찾기 상태 변경에 실패했습니다.");
  }
};

export const toggleAssetLike = async (assetId) => {
  if (!assetId) {
    throw new Error("에셋 ID가 필요합니다.");
  }

  try {
    const response = await api.post(`/assets/${assetId}/toggle-like`);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "좋아요 상태 변경에 실패했습니다.");
  }
};

// 프로젝트별 에셋 관리
export const fetchProjectAssets = async (projectId) => {
  if (!projectId) {
    throw new Error("프로젝트 ID가 필요합니다.");
  }

  try {
    const response = await api.get(`/projects/${projectId}/assets`);
    const data = extractResponseData(response);

    return Array.isArray(data) ? data : data?.assets || [];
  } catch (error) {
    handleApiError(error, "프로젝트 에셋을 가져오는데 실패했습니다.");
  }
};

export const createProjectAsset = async (projectId, assetData) => {
  if (!projectId) {
    throw new Error("프로젝트 ID가 필요합니다.");
  }

  if (!assetData || !assetData.name) {
    throw new Error("에셋 데이터가 올바르지 않습니다.");
  }

  try {
    const response = await api.post(`/projects/${projectId}/assets`, assetData);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "프로젝트 에셋 생성에 실패했습니다.");
  }
};

export const toggleProjectAssetFavorite = async (projectId, assetId) => {
  if (!projectId || !assetId) {
    throw new Error("프로젝트 ID와 에셋 ID가 필요합니다.");
  }

  try {
    const response = await api.post(
      `/projects/${projectId}/assets/${assetId}/toggle-favorite`
    );
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "즐겨찾기 상태 변경에 실패했습니다.");
  }
};

// Leonardo AI 관련
export const generateImage = async (payload) => {
  if (!payload || !payload.storyText) {
    throw new Error("이미지 생성에 필요한 데이터가 없습니다.");
  }

  try {
    const response = await api.post("/leonardo/generate-image", payload);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "이미지 생성에 실패했습니다.");
  }
};

export const uploadReferenceImage = async (imageUrl) => {
  if (!imageUrl) {
    throw new Error("이미지 URL이 필요합니다.");
  }

  try {
    const response = await api.post("/leonardo/upload-reference-image", {
      imageUrl,
    });
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "참조 이미지 업로드에 실패했습니다.");
  }
};

export const uploadTrainingImage = async (datasetId, file) => {
  if (!datasetId || !file) {
    throw new Error("데이터셋 ID와 파일이 필요합니다.");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/leonardo/upload-training-image/${datasetId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "훈련 이미지 업로드에 실패했습니다.");
  }
};

// Leonardo AI API 응답을 UI에서 사용할 수 있는 형태로 변환
export const fetchLeonardoElements = async () => {
  try {
    console.log("🔍 Leonardo AI에서 elements 가져오는 중...");

    const response = await makeRequestWithRetry(
      () => api.get("/leonardo/list-elements"),
      3, // 최대 3번 재시도
      3000 // 3초 기본 지연
    );
    const data = extractResponseData(response);

    console.log("📋 Leonardo AI 원본 응답:", data);
    console.log("📦 Elements 배열:", data.elements);

    // 먼저 userId 확인
    const healthResponse = await api.get("/leonardo/health");
    const healthData = extractResponseData(healthResponse);
    const userId = healthData.userId;

    console.log("👤 사용자 ID:", userId);

    // Leonardo AI API 응답을 UI에서 사용할 수 있는 형태로 변환
    const formattedAssets = await Promise.all(
      data.elements?.map(async (element) => {
        console.log("🔧 변환 중인 element:", element);

        let thumbnailUrl = element.thumbnailUrl;

        // 먼저 Element 상세 정보에서 이미지 URL 확인
        try {
          console.log(`🔍 Element ${element.id} 상세 정보 요청 중...`);
          const detailResponse = await api.get(
            `/leonardo/elements/${element.id}/details`
          );
          const detailData = extractResponseData(detailResponse);
          console.log(`📋 Element ${element.id} 상세 응답:`, detailData);

          // 상세 정보에서 이미지 URL 찾기
          if (detailData.element) {
            const elementDetail = detailData.element;
            console.log(
              `🎯 Element ${element.id} 상세 구조:`,
              JSON.stringify(elementDetail, null, 2)
            );

            // 먼저 Dataset ID가 있는지 확인하고 첫 번째 이미지 가져오기
            if (elementDetail.datasetId) {
              try {
                console.log(
                  `🗂️ Element ${element.id}의 Dataset ${elementDetail.datasetId}에서 첫 번째 이미지 찾는 중...`
                );
                const datasetResponse = await api.get(
                  `/leonardo/datasets/${elementDetail.datasetId}`
                );
                const datasetData = extractResponseData(datasetResponse);

                if (datasetData.firstImageUrl) {
                  console.log(
                    `✅ Dataset의 첫 번째 이미지 발견: ${datasetData.firstImageUrl}`
                  );
                  thumbnailUrl = datasetData.firstImageUrl;
                } else if (
                  datasetData.images &&
                  datasetData.images.length > 0
                ) {
                  // images 배열에서 첫 번째 이미지 확인
                  const firstImage = datasetData.images[0];
                  console.log(`🎯 첫 번째 이미지 정보:`, firstImage);

                  // 다양한 가능한 URL 필드 확인
                  const imageUrlFields = [
                    "url",
                    "image_url",
                    "s3_url",
                    "leonardo_url",
                    "file_url",
                  ];
                  for (const field of imageUrlFields) {
                    if (firstImage[field]) {
                      console.log(
                        `✅ Dataset 첫 번째 이미지 URL 발견: ${field} = ${firstImage[field]}`
                      );
                      thumbnailUrl = firstImage[field];
                      break;
                    }
                  }
                }
              } catch (datasetError) {
                console.warn(
                  `⚠️ Dataset ${elementDetail.datasetId} 정보 가져오기 실패:`,
                  datasetError
                );
              }
            }

            // Dataset에서 이미지를 찾지 못한 경우 Element 자체에서 이미지 URL 찾기
            if (!thumbnailUrl) {
              // 다양한 가능한 이미지 URL 필드 확인
              const possibleImageFields = [
                "thumbnailUrl",
                "thumbnail_url",
                "imageUrl",
                "image_url",
                "previewImage",
                "preview_image",
                "coverImage",
                "cover_image",
                "sampleImage",
                "sample_image",
                "url",
                "image",
              ];

              for (const field of possibleImageFields) {
                if (elementDetail[field]) {
                  console.log(
                    `✅ Element ${element.id}에서 이미지 URL 발견: ${field} = ${elementDetail[field]}`
                  );
                  thumbnailUrl = elementDetail[field];
                  break;
                }
              }
            }
          }
        } catch (detailError) {
          console.warn(
            `⚠️ Element ${element.id} 상세 정보 가져오기 실패:`,
            detailError
          );
        }

        // 썸네일 URL이 없으면 바로 플레이스홀더 사용
        if (!thumbnailUrl) {
          // 기본 플레이스홀더 이미지 사용
          const placeholderOptions = [
            "https://via.placeholder.com/256x256/6366f1/ffffff?text=" +
              encodeURIComponent(element.name),
            "https://ui-avatars.com/api/?name=" +
              encodeURIComponent(element.name) +
              "&size=256&background=6366f1&color=ffffff&bold=true",
            `data:image/svg+xml,${encodeURIComponent(`
              <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
                <rect width="256" height="256" fill="#6366f1"/>
                <text x="128" y="128" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dy="0.3em">${element.name}</text>
              </svg>
            `)}`,
          ];

          thumbnailUrl = placeholderOptions[1]; // UI Avatars 사용
        }

        const formatted = {
          id: element.id?.toString() || Math.random().toString(),
          name: element.name || "이름 없음",
          triggerWord: element.instancePrompt || "없음",
          category: mapLeonardoCategory(element.focus),
          status: element.status || "UNKNOWN",
          imageUrl: thumbnailUrl,
          isFavorite: false,
          userLoraId: element.id,
          instancePrompt: element.instancePrompt,
          focus: element.focus,
          createdAt: element.createdAt,
          updatedAt: element.updatedAt,
          description: element.description,
          resolution: element.resolution,
          baseModel: element.baseModel,
        };

        console.log("✅ 변환된 asset:", formatted);
        return formatted;
      }) || []
    );

    console.log("🎯 최종 변환된 assets:", formattedAssets);

    return {
      success: true,
      assets: formattedAssets,
      count: formattedAssets.length,
    };
  } catch (error) {
    console.error("❌ Leonardo AI API 에러:", error);
    handleApiError(error, "Leonardo AI 에셋을 불러오는데 실패했습니다.");
  }
};

// Leonardo focus 값을 UI 카테고리로 매핑
const mapLeonardoCategory = (focus) => {
  console.log("🎯 매핑 중인 focus 값:", focus);

  const focusMap = {
    general: "Style",
    General: "Style", // 대문자도 처리
    character: "Character",
    Character: "Character",
    object: "Object",
    Object: "Object",
    style: "Style",
    Style: "Style",
    concept: "Style",
    Concept: "Style",
    clothing: "Object",
    Clothing: "Object",
    face: "Character",
    Face: "Character",
  };

  const result = focusMap[focus] || "Style";
  console.log(`🔄 focus "${focus}" -> category "${result}"`);
  return result;
};

export const createDataset = async (name, description = "") => {
  if (!name) {
    throw new Error("데이터셋 이름이 필요합니다.");
  }

  try {
    const response = await api.post("/leonardo/create-dataset", {
      name,
      description,
    });
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "데이터셋 생성에 실패했습니다.");
  }
};

export const trainElement = async (elementData) => {
  if (!elementData || !elementData.name) {
    throw new Error("엘리먼트 훈련 데이터가 올바르지 않습니다.");
  }

  try {
    const response = await api.post("/leonardo/train-element", elementData);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "엘리먼트 훈련에 실패했습니다.");
  }
};

export const deleteElement = async (elementId) => {
  if (!elementId) {
    throw new Error("엘리먼트 ID가 필요합니다.");
  }

  try {
    const response = await api.delete(`/leonardo/delete-element/${elementId}`);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "엘리먼트 삭제에 실패했습니다.");
  }
};

export const getElementStatus = async (elementId) => {
  if (!elementId) {
    throw new Error("엘리먼트 ID가 필요합니다.");
  }

  try {
    const response = await api.get(`/leonardo/elements/${elementId}`);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "엘리먼트 상태 조회에 실패했습니다.");
  }
};

// 서비스 상태 확인
export const checkAssetServiceHealth = async () => {
  try {
    const response = await api.get("/ping");
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "서비스 상태 확인에 실패했습니다.");
  }
};

export const checkLeonardoHealth = async () => {
  try {
    const response = await api.get("/leonardo/health");
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "Leonardo 서비스 상태 확인에 실패했습니다.");
  }
};

export default {
  // 전역 에셋
  fetchAssets,
  toggleAssetFavorite,
  toggleAssetLike,

  // 프로젝트 에셋
  fetchProjectAssets,
  createProjectAsset,
  toggleProjectAssetFavorite,

  // Leonardo AI
  generateImage,
  uploadReferenceImage,
  uploadTrainingImage,
  fetchLeonardoElements,
  createDataset,
  trainElement,
  deleteElement,
  getElementStatus,

  // 상태 확인
  checkAssetServiceHealth,
  checkLeonardoHealth,
};
