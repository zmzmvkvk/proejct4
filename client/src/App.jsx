import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";

import ProjectSelectionPage from "./components/ProjectSelectionPage";
import ProjectDetail from "./components/ProjectDetail";

// QueryClient 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// 메인 App 컴포넌트
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<ProjectSelectionPage />} />
              <Route path="/project/:projectId" element={<ProjectDetail />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>

          {/* 글로벌 토스트 컨테이너 */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              // 기본 설정
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "14px",
                maxWidth: "400px",
              },
              // 성공 토스트
              success: {
                duration: 3000,
                style: {
                  background: "#10b981",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#10b981",
                },
              },
              // 에러 토스트
              error: {
                duration: 5000,
                style: {
                  background: "#ef4444",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#ef4444",
                },
              },
              // 로딩 토스트
              loading: {
                duration: Infinity,
                style: {
                  background: "#3b82f6",
                },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// 404 페이지 컴포넌트
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">페이지를 찾을 수 없습니다</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default App;
