import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ProjectSelectionPage from "./components/ProjectSelectionPage";
import ProjectDetail from "./components/ProjectDetail";

// 메인 App 컴포넌트
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectSelectionPage />} />
        <Route path="/project/:projectId" element={<ProjectDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

// QueryClient 설정
const queryClient = new QueryClient();

// 앱 래퍼
export default function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
