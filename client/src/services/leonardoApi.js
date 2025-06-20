import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3분 - Leonardo 폴링 시간(150초)보다 여유있게 설정
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(
      `[Leonardo API Request] ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log(
      `[Leonardo API Response] ${response.status} ${response.config.url}`
    );
    return response;
  },
  (error) => {
    console.error(
      `[Leonardo API Error] ${error.response?.status} ${error.config?.url}`,
      error.response?.data
    );
    return Promise.reject(error);
  }
);

export const generateImage = async (
  storyText,
  characterName = null,
  triggerWord = null,
  assetId = null
) => {
  try {
    const payload = {
      storyText,
      characterName,
      triggerWord,
      assetId,
    };

    console.log("📤 [Leonardo API Client] 전송할 페이로드:", payload);
    console.log("🔍 [Leonardo API Client] 페이로드 상세:", {
      storyText: storyText?.substring(0, 100) + "...",
      characterName,
      triggerWord,
      assetId,
      hasStoryText: !!storyText,
      hasCharacterName: !!characterName,
      hasTriggerWord: !!triggerWord,
      hasAssetId: !!assetId,
      assetIdType: typeof assetId,
    });

    const response = await api.post("/leonardo/generate-image", payload);
    return response.data;
  } catch (error) {
    console.error("❌ [Leonardo API Client] 에러 상세:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw new Error(
      error.response?.data?.error || "이미지 생성에 실패했습니다."
    );
  }
};

export const listElements = async () => {
  try {
    const response = await api.get("/leonardo/list-elements");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "커스텀 엘리먼트 목록 조회에 실패했습니다."
    );
  }
};

export const createDataset = async (name, description) => {
  try {
    const response = await api.post("/leonardo/create-dataset", {
      name,
      description,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "데이터셋 생성에 실패했습니다."
    );
  }
};

export const trainElement = async (elementData) => {
  try {
    const response = await api.post("/leonardo/train-element", elementData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "엘리먼트 학습에 실패했습니다."
    );
  }
};

export const deleteElement = async (elementId) => {
  try {
    const response = await api.delete(`/leonardo/delete-element/${elementId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "엘리먼트 삭제에 실패했습니다."
    );
  }
};

export const getElementStatus = async (elementId) => {
  try {
    const response = await api.get(`/leonardo/elements/${elementId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "엘리먼트 상태 조회에 실패했습니다."
    );
  }
};

export const uploadTrainingImage = async (datasetId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("datasetId", datasetId);

    const response = await api.post(
      "/leonardo/upload-training-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "트레이닝 이미지 업로드에 실패했습니다."
    );
  }
};
