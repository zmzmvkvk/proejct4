import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(`[OpenAI API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log(`[OpenAI API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[OpenAI API Error] ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

export const enhancePrompt = async (sceneDescription, character) => {
  try {
    const response = await api.post('/openai/enhance-prompt', {
      sceneDescription,
      character,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '프롬프트 강화에 실패했습니다.');
  }
};

export const generateVisionCaption = async (file, characterName) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('characterName', characterName);

    const response = await api.post('/openai/vision-caption', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '이미지 캡션 생성에 실패했습니다.');
  }
};

export const generateDescription = async (prompt) => {
  try {
    const response = await api.post('/openai/gpt-description', { prompt });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '설명 생성에 실패했습니다.');
  }
};