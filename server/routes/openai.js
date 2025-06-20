const express = require("express");
const multer = require("multer");
const openaiService = require("../services/openaiService");
const logger = require("../config/logger");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// 입력 검증 헬퍼 함수
const validateRequiredFields = (fields, body) => {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

// 에러 응답 헬퍼 함수
const handleError = (res, error, operation) => {
  logger.error(`OpenAI API Error - ${operation}`, {
    error: error.message,
    stack: error.stack,
    response: error.response?.data,
  });

  const statusCode = error.response?.status || 500;
  res.status(statusCode).json({
    error: error.message,
    operation,
    ...(process.env.NODE_ENV === "development" && {
      details: error.response?.data,
    }),
  });
};

// 프롬프트 강화 엔드포인트
router.post("/enhance-prompt", async (req, res) => {
  try {
    validateRequiredFields(["sceneDescription"], req.body);
    const { sceneDescription, character } = req.body;

    logger.info("Enhancing prompt with OpenAI", {
      sceneDescription: sceneDescription.substring(0, 100) + "...",
      character,
    });

    const result = await openaiService.enhancePrompt(
      sceneDescription,
      character
    );

    logger.info("Prompt enhanced successfully");
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    handleError(res, error, "enhance-prompt");
  }
});

// GPT-4o Vision 기반 이미지 캡션 생성 엔드포인트
router.post("/vision-caption", upload.single("file"), async (req, res) => {
  try {
    const { characterName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: "No file uploaded",
        operation: "vision-caption",
      });
    }

    logger.info("Generating vision caption", {
      fileName: file.originalname,
      fileSize: file.size,
      characterName,
    });

    const caption = await openaiService.generateVisionCaption(
      file.buffer,
      file.mimetype,
      characterName
    );

    logger.info("Vision caption generated successfully");
    res.json({
      success: true,
      caption,
    });
  } catch (error) {
    handleError(res, error, "vision-caption");
  }
});

// GPT-4o 기반 description 생성 엔드포인트
router.post("/gpt-description", async (req, res) => {
  try {
    validateRequiredFields(["prompt"], req.body);
    const { prompt } = req.body;

    logger.info("Generating GPT description", {
      prompt: prompt.substring(0, 100) + "...",
    });

    const description = await openaiService.generateDescription(prompt);

    logger.info("GPT description generated successfully");
    res.json({
      success: true,
      description,
    });
  } catch (error) {
    handleError(res, error, "gpt-description");
  }
});

// 서비스 상태 확인 엔드포인트
router.get("/health", async (req, res) => {
  try {
    // 간단한 테스트 요청으로 OpenAI 연결 확인
    await openaiService.generateDescription("Test");

    res.json({
      success: true,
      service: "OpenAI",
      status: "healthy",
    });
  } catch (error) {
    logger.error("OpenAI health check failed", { error: error.message });
    res.status(503).json({
      success: false,
      service: "OpenAI",
      status: "unhealthy",
      error: error.message,
    });
  }
});

module.exports = router;
