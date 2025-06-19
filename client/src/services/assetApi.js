import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 이미지 생성은 시간이 오래 걸릴 수 있으므로 60초로 설정
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(`[Asset API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log(`[Asset API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[Asset API Error] ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

// 전역 에셋 관리
export const fetchAssets = async () => {
  try {
    const response = await api.get('/assets');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '에셋 목록을 가져오는데 실패했습니다.');
  }
};

export const toggleAssetFavorite = async (assetId) => {
  try {
    const response = await api.post(`/assets/${assetId}/toggle-favorite`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '즐겨찾기 상태 변경에 실패했습니다.');
  }
};

export const toggleAssetLike = async (assetId) => {
  try {
    const response = await api.post(`/assets/${assetId}/toggle-like`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '좋아요 상태 변경에 실패했습니다.');
  }
};

// 프로젝트별 에셋 관리
export const fetchProjectAssets = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/assets`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '프로젝트 에셋을 가져오는데 실패했습니다.');
  }
};

export const createProjectAsset = async (projectId, assetData) => {
  try {
    const response = await api.post(`/projects/${projectId}/assets`, assetData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '프로젝트 에셋 생성에 실패했습니다.');
  }
};

export const toggleProjectAssetFavorite = async (projectId, assetId) => {
  try {
    const response = await api.post(`/projects/${projectId}/assets/${assetId}/toggle-favorite`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '즐겨찾기 상태 변경에 실패했습니다.');
  }
};

// Leonardo AI 관련
export const generateImage = async (payload) => {
  try {
    const response = await api.post('/leonardo/generate-image', payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '이미지 생성에 실패했습니다.');
  }
};

export const uploadReferenceImage = async (imageUrl) => {
  try {
    const response = await api.post('/leonardo/upload-reference-image', { imageUrl });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '참조 이미지 업로드에 실패했습니다.');
  }
};

export const uploadTrainingImage = async (datasetId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/leonardo/upload-training-image/${datasetId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '훈련 이미지 업로드에 실패했습니다.');
  }
};

export const fetchLeonardoElements = async () => {
  try {
    const response = await api.get('/leonardo/list-elements');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Leonardo 엘리먼트 목록을 가져오는데 실패했습니다.');
  }
};

export const createDataset = async (name, description) => {
  try {
    const response = await api.post('/leonardo/create-dataset', { name, description });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '데이터셋 생성에 실패했습니다.');
  }
};

export const trainElement = async (elementData) => {
  try {
    const response = await api.post('/leonardo/train-element', elementData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '엘리먼트 훈련에 실패했습니다.');
  }
};

export const deleteElement = async (elementId) => {
  try {
    const response = await api.delete(`/leonardo/delete-element/${elementId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '엘리먼트 삭제에 실패했습니다.');
  }
};

export const getElementStatus = async (elementId) => {
  try {
    const response = await api.get(`/leonardo/elements/${elementId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '엘리먼트 상태 조회에 실패했습니다.');
  }
};