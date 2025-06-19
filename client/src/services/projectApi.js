import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[API Error] ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

export const fetchProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '프로젝트 목록을 가져오는데 실패했습니다.');
  }
};

export const createProject = async (name) => {
  try {
    const response = await api.post('/projects', { name });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '프로젝트 생성에 실패했습니다.');
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '프로젝트 삭제에 실패했습니다.');
  }
};

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