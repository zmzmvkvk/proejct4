import toast from "react-hot-toast";

// 토스트 설정
const toastConfig = {
  duration: 4000,
  position: "top-right",
  style: {
    borderRadius: "8px",
    background: "#333",
    color: "#fff",
    fontSize: "14px",
  },
};

// 성공 토스트
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...toastConfig,
    ...options,
    icon: "✅",
  });
};

// 에러 토스트
export const showError = (message, options = {}) => {
  return toast.error(message, {
    ...toastConfig,
    ...options,
    icon: "❌",
  });
};

// 정보 토스트
export const showInfo = (message, options = {}) => {
  return toast(message, {
    ...toastConfig,
    ...options,
    icon: "ℹ️",
  });
};

// 경고 토스트
export const showWarning = (message, options = {}) => {
  return toast(message, {
    ...toastConfig,
    ...options,
    icon: "⚠️",
    style: {
      ...toastConfig.style,
      background: "#f59e0b",
    },
  });
};

// 로딩 토스트
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...toastConfig,
    ...options,
  });
};

// 프로미스 토스트 (API 호출용)
export const showPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || "처리 중...",
      success: messages.success || "완료되었습니다!",
      error: messages.error || "오류가 발생했습니다.",
    },
    {
      ...toastConfig,
      ...options,
    }
  );
};

// 토스트 제거
export const dismissToast = (toastId) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

// API 에러 처리 헬퍼
export const handleApiError = (error) => {
  console.error("API Error:", error);

  let message = "알 수 없는 오류가 발생했습니다.";

  if (error.response) {
    // 서버 응답이 있는 경우
    const { status, data } = error.response;

    if (data?.error) {
      message = data.error;
    } else if (status === 400) {
      message = "잘못된 요청입니다.";
    } else if (status === 401) {
      message = "인증이 필요합니다.";
    } else if (status === 403) {
      message = "권한이 없습니다.";
    } else if (status === 404) {
      message = "요청한 리소스를 찾을 수 없습니다.";
    } else if (status === 429) {
      message = "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
    } else if (status >= 500) {
      message = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
  } else if (error.request) {
    // 네트워크 오류
    message = "네트워크 연결을 확인해주세요.";
  } else if (error.message) {
    // 기타 에러
    message = error.message;
  }

  showError(message);
  return message;
};

export default {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  promise: showPromise,
  dismiss: dismissToast,
  handleApiError,
};
