import React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Button from "./Button";

// 에러 폴백 컴포넌트
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const isDevelopment = import.meta.env.MODE === "development";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          앗! 문제가 발생했습니다
        </h1>

        <p className="text-gray-600 mb-6">
          예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로
          돌아가세요.
        </p>

        {isDevelopment && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              개발 모드 에러 정보:
            </h3>
            <pre className="text-xs text-red-700 whitespace-pre-wrap break-all">
              {error.message}
            </pre>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={resetErrorBoundary}
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>

          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            홈으로 가기
          </Button>
        </div>
      </div>
    </div>
  );
};

// 에러 로깅 함수
const logError = (error, errorInfo) => {
  console.error("ErrorBoundary caught an error:", error, errorInfo);

  // 운영 환경에서는 에러 리포팅 서비스로 전송
  if (import.meta.env.PROD) {
    // 예: Sentry, LogRocket 등
    // errorReportingService.captureException(error, { extra: errorInfo });
  }
};

// ErrorBoundary 래퍼 컴포넌트
const ErrorBoundary = ({ children, fallback = ErrorFallback }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onError={logError}
      onReset={() => {
        // 필요한 경우 상태 초기화
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
