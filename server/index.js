const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// 환경 변수 로드
dotenv.config({ path: path.resolve(__dirname, ".env") });

// 라우터 임포트 (Firebase 관련 라우터는 임시로 주석 처리)
const leonardoRouter = require("./routes/leonardo");
const openaiRouter = require("./routes/openai");
// const projectsRouter = require("./routes/projects");
// const assetsRouter = require("./routes/assets");

// Express 앱 설정
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우터 등록 (Firebase 관련은 임시로 주석 처리)
app.use("/api/leonardo", leonardoRouter);
app.use("/api/openai", openaiRouter);
// app.use("/api/projects", projectsRouter);
// app.use("/api/assets", assetsRouter);

// 기존 API 엔드포인트 호환성 유지 (기존 클라이언트 코드와 호환)
app.use("/api/upload-reference-image", leonardoRouter);
app.use("/api/upload-training-image", leonardoRouter);
app.use("/api/generate-image", leonardoRouter);
app.use("/api/list-elements", leonardoRouter);
app.use("/api/create-dataset", leonardoRouter);
app.use("/api/train-element", leonardoRouter);
app.use("/api/delete-element", leonardoRouter);
app.use("/api/elements", leonardoRouter);
app.use("/api/enhance-prompt", openaiRouter);
app.use("/api/vision-caption", openaiRouter);
app.use("/api/gpt-description", openaiRouter);

// 서버 상태 확인 엔드포인트
app.get("/api/ping", (req, res) => {
  res.json({ 
    message: "pong", 
    timestamp: new Date().toISOString(),
    version: "2.0.0-modularized",
    status: "Server is running successfully! 🚀",
    endpoints: {
      leonardo: "/api/leonardo",
      openai: "/api/openai",
      // projects: "/api/projects", // Firebase 필요
      // assets: "/api/assets" // Firebase 필요
    }
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📊 API endpoints available at http://localhost:${port}/api`);
  console.log(`✨ Modularized architecture implemented successfully!`);
  console.log(`⚠️  Firebase routes temporarily disabled - need service account key`);
});

module.exports = app;