const express = require("express");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");

// 환경 변수 로드
dotenv.config({ path: path.resolve(__dirname, ".env") });

// 로거 초기화
const logger = require("./config/logger");

// Firebase 초기화
const { initializeFirebase } = require("./config/firebase");

// 미들웨어 임포트
const {
  corsOptions,
  limiter,
  requestLogger,
  errorHandler,
  notFoundHandler,
} = require("./middleware");

// 라우터 임포트
const leonardoRouter = require("./routes/leonardo");
const openaiRouter = require("./routes/openai");
const projectsRouter = require("./routes/projects");
const assetsRouter = require("./routes/assets");

// Express 앱 설정
const app = express();
const port = process.env.PORT || 3000;

// 보안 미들웨어
app.use(helmet());

// 기본 미들웨어 설정
app.use(require("cors")(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use(limiter);

// 요청 로깅
app.use(requestLogger);

// 서버 시작 시 Firebase 초기화
const initializeServer = async () => {
  try {
    logger.info("Starting server initialization...");

    // Firebase 초기화
    await initializeFirebase();
    logger.info("Firebase initialized successfully");

    // 라우터 등록
    app.use("/api/leonardo", leonardoRouter);
    app.use("/api/openai", openaiRouter);
    app.use("/api/projects", projectsRouter);
    app.use("/api/assets", assetsRouter);

    // 기존 API 엔드포인트 호환성 유지 (제거됨 - 이제 /api/leonardo, /api/openai 라우터 사용)

    // 서버 상태 확인 엔드포인트
    app.get("/api/ping", (req, res) => {
      res.json({
        success: true,
        message: "pong",
        timestamp: new Date().toISOString(),
        version: "2.0.0-stable",
        status: "Server is running successfully! 🚀",
        services: {
          leonardo: "/api/leonardo",
          openai: "/api/openai",
          projects: "/api/projects",
          assets: "/api/assets",
        },
        health: {
          leonardo: "/api/leonardo/health",
          openai: "/api/openai/health",
        },
      });
    });

    // 전체 서비스 상태 확인
    app.get("/api/health", async (req, res) => {
      const healthChecks = {
        server: "healthy",
        firebase: "unknown",
        leonardo: "unknown",
        openai: "unknown",
      };

      try {
        // Firebase 연결 확인
        const { isFirebaseConnected } = require("./config/firebase");
        healthChecks.firebase = isFirebaseConnected() ? "healthy" : "unhealthy";
      } catch (error) {
        healthChecks.firebase = "unhealthy";
      }

      const allHealthy = Object.values(healthChecks).every(
        (status) => status === "healthy"
      );

      res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        status: allHealthy ? "healthy" : "degraded",
        services: healthChecks,
        timestamp: new Date().toISOString(),
      });
    });

    // 404 핸들러
    app.use(notFoundHandler);

    // 에러 핸들러 (마지막에 등록)
    app.use(errorHandler);

    // 서버 시작
    app.listen(port, () => {
      logger.info("🚀 AI Storyboard Server Started", {
        port,
        environment: process.env.NODE_ENV || "development",
        version: "2.0.0-stable",
        endpoints: {
          api: `http://localhost:${port}/api`,
          health: `http://localhost:${port}/api/health`,
          ping: `http://localhost:${port}/api/ping`,
        },
      });

      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 🎬 AI Storyboard Server v2.0                ║
║                                                              ║
║  🚀 Server:     http://localhost:${port}                        ║
║  📊 API:        http://localhost:${port}/api                    ║
║  💚 Health:     http://localhost:${port}/api/health             ║
║  🔥 Firebase:   Connected                                    ║
║  🎨 Leonardo:   /api/leonardo                                ║
║  🤖 OpenAI:     /api/openai                                  ║
║  📁 Projects:   /api/projects                                ║
║  🎯 Assets:     /api/assets                                  ║
║                                                              ║
║  ✨ Modularized | Secured | Logged | Monitored              ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error("Failed to initialize server", {
      error: error.message,
      stack: error.stack,
    });

    console.error("❌ Server initialization failed:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown 처리
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// 처리되지 않은 에러 핸들링
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", {
    reason,
    promise,
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });

  process.exit(1);
});

// 서버 초기화 시작
initializeServer();

module.exports = app;
