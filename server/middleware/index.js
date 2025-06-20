const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("../config/logger");

// CORS 설정
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
};

// Rate Limiting 설정
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 요청 로깅 미들웨어
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("HTTP Request", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  });

  next();
};

// 에러 핸들링 미들웨어
const errorHandler = (err, req, res, next) => {
  logger.error("Unhandled Error", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // 운영 환경에서는 상세한 에러 정보 숨김
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};

// 404 핸들러
const notFoundHandler = (req, res) => {
  logger.warn("Route not found", {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    error: {
      message: "Route not found",
      path: req.url,
    },
  });
};

module.exports = {
  corsOptions,
  limiter,
  requestLogger,
  errorHandler,
  notFoundHandler,
};
