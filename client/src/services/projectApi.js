import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
          `⏳ Project API 요청 실패 (${
            error.response?.status
          }), ${totalDelay.toFixed(0)}ms 후 재시도 (${attempt}/${maxRetries})`
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
    console.log(`🚀 [Project API Request] ${method} ${url}`);

    // 요청 시작 시간 기록
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    console.error("❌ [Project API Request Error]", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    const status = response.status;
    const url = response.config.url;

    console.log(`✅ [Project API Response] ${status} ${url} (${duration}ms)`);

    return response;
  },
  (error) => {
    const duration = error.config?.metadata?.startTime
      ? new Date() - error.config.metadata.startTime
      : 0;
    const status = error.response?.status || "Network Error";
    const url = error.config?.url || "Unknown";

    console.error(`❌ [Project API Error] ${status} ${url} (${duration}ms)`, {
      error: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

// 에러 처리 헬퍼
const handleApiError = (error, defaultMessage) => {
  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    defaultMessage;

  console.error("Project API Error Details:", {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    url: error.config?.url,
    method: error.config?.method,
  });

  throw new Error(message);
};

// 응답 데이터 추출 헬퍼
const extractResponseData = (response) => {
  // 서버가 { success: true, data: ... } 형태로 응답하는 경우 처리
  if (response.data?.success && response.data?.data !== undefined) {
    return response.data.data;
  }

  // 서버가 직접 데이터를 반환하는 경우
  return response.data;
};

// =============================================================================
// 프로젝트 관리
// =============================================================================

export const fetchProjects = async () => {
  try {
    const response = await api.get("/projects");
    const data = extractResponseData(response);

    // 배열이 아닌 경우 빈 배열 반환
    return Array.isArray(data) ? data : data?.projects || [];
  } catch (error) {
    handleApiError(error, "프로젝트 목록을 가져오는데 실패했습니다.");
  }
};

export const fetchProject = async (projectId) => {
  if (!projectId) {
    throw new Error("프로젝트 ID가 필요합니다.");
  }

  try {
    const response = await makeRequestWithRetry(
      () => api.get(`/projects/${projectId}`),
      3, // 최대 3번 재시도
      2000 // 2초 기본 지연
    );
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "프로젝트 정보를 가져오는데 실패했습니다.");
  }
};

export const createProject = async (projectData) => {
  if (!projectData || !projectData.name) {
    throw new Error("프로젝트 이름이 필요합니다.");
  }

  try {
    const response = await api.post("/projects", projectData);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "프로젝트 생성에 실패했습니다.");
  }
};

export const updateProject = async (projectId, updates) => {
  if (!projectId) {
    throw new Error("프로젝트 ID가 필요합니다.");
  }

  try {
    const response = await api.put(`/projects/${projectId}`, updates);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "프로젝트 수정에 실패했습니다.");
  }
};

export const deleteProject = async (projectId) => {
  if (!projectId) {
    throw new Error("프로젝트 ID가 필요합니다.");
  }

  try {
    const response = await api.delete(`/projects/${projectId}`);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "프로젝트 삭제에 실패했습니다.");
  }
};

// =============================================================================
// 프로젝트 에셋 관리
// =============================================================================

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

export const updateProjectAsset = async (projectId, assetId, updates) => {
  if (!projectId || !assetId) {
    throw new Error("프로젝트 ID와 에셋 ID가 필요합니다.");
  }

  try {
    const response = await api.put(
      `/projects/${projectId}/assets/${assetId}`,
      updates
    );
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "프로젝트 에셋 수정에 실패했습니다.");
  }
};

export const deleteProjectAsset = async (projectId, assetId) => {
  if (!projectId || !assetId) {
    throw new Error("프로젝트 ID와 에셋 ID가 필요합니다.");
  }

  try {
    const response = await api.delete(
      `/projects/${projectId}/assets/${assetId}`
    );
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "프로젝트 에셋 삭제에 실패했습니다.");
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

// =============================================================================
// 프로젝트 통계 및 상태
// =============================================================================

export const fetchProjectStats = async (projectId) => {
  if (!projectId) {
    throw new Error("프로젝트 ID가 필요합니다.");
  }

  try {
    const response = await api.get(`/projects/${projectId}/stats`);
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "프로젝트 통계를 가져오는데 실패했습니다.");
  }
};

// =============================================================================
// 서비스 상태 확인
// =============================================================================

export const checkProjectServiceHealth = async () => {
  try {
    const response = await api.get("/ping");
    return extractResponseData(response);
  } catch (error) {
    handleApiError(error, "서비스 상태 확인에 실패했습니다.");
  }
};

// =============================================================================
// 기본 내보내기
// =============================================================================

export default {
  // 프로젝트 관리
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,

  // 프로젝트 에셋 관리
  fetchProjectAssets,
  createProjectAsset,
  updateProjectAsset,
  deleteProjectAsset,
  toggleProjectAssetFavorite,

  // 통계 및 상태
  fetchProjectStats,
  checkProjectServiceHealth,
};
