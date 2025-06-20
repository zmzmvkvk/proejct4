const express = require("express");
const multer = require("multer");
const leonardoService = require("../services/leonardoService");
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
  console.log("🔍 [SERVER DEBUG] 필드 검증 시작:", {
    requiredFields: fields,
    receivedBody: body,
    bodyType: typeof body,
    bodyKeys: Object.keys(body || {}),
  });

  const missing = fields.filter((field) => {
    const hasField = !!body[field];
    console.log(
      `📋 [SERVER DEBUG] 필드 "${field}" 체크: ${
        hasField ? "✅ 있음" : "❌ 없음"
      } (값: ${body[field]})`
    );
    return !hasField;
  });

  if (missing.length > 0) {
    console.error("❌ [SERVER DEBUG] 필수 필드 누락:", missing);
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  console.log("✅ [SERVER DEBUG] 필드 검증 통과");
};

// 에러 응답 헬퍼 함수
const handleError = (res, error, operation) => {
  logger.error(`Leonardo API Error - ${operation}`, {
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

// Leonardo.ai에 URL로 이미지를 업로드하고 ID를 받아오는 엔드포인트
router.post("/upload-reference-image", async (req, res) => {
  try {
    validateRequiredFields(["imageUrl"], req.body);
    const { imageUrl } = req.body;

    logger.info("Uploading reference image to Leonardo", { imageUrl });

    const imageId = await leonardoService.uploadReferenceImage(imageUrl);

    logger.info("Reference image uploaded successfully", { imageId });
    res.json({ id: imageId, success: true });
  } catch (error) {
    handleError(res, error, "upload-reference-image");
  }
});

// 학습용 이미지 업로드 엔드포인트
router.post(
  "/upload-training-image/:datasetId",
  upload.single("file"),
  async (req, res) => {
    try {
      const { datasetId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: "No file uploaded",
          operation: "upload-training-image",
        });
      }

      if (!datasetId) {
        return res.status(400).json({
          error: "Dataset ID is required",
          operation: "upload-training-image",
        });
      }

      logger.info("Uploading training image", {
        datasetId,
        fileName: file.originalname,
        fileSize: file.size,
      });

      const imageId = await leonardoService.uploadTrainingImage(
        datasetId,
        file
      );

      logger.info("Training image uploaded successfully", {
        imageId,
        datasetId,
      });
      res.json({
        imageId,
        message: "Image uploaded successfully",
        success: true,
      });
    } catch (error) {
      handleError(res, error, "upload-training-image");
    }
  }
);

// 캐릭터 기반 이미지 생성 엔드포인트
router.post("/generate-image", async (req, res) => {
  try {
    console.log("🎨 [SERVER DEBUG] 원본 요청 받음:", {
      method: req.method,
      url: req.url,
      headers: {
        "content-type": req.headers["content-type"],
        "content-length": req.headers["content-length"],
      },
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {}),
    });

    validateRequiredFields(["storyText"], req.body);
    const { storyText, characterName, triggerWord, assetId } = req.body;

    console.log("🎨 [SERVER DEBUG] 이미지 생성 요청 받음:", {
      storyText: storyText?.substring(0, 100) + "...",
      characterName,
      triggerWord,
      assetId,
      hasCharacterName: !!characterName,
      hasTriggerWord: !!triggerWord,
      hasAssetId: !!assetId,
      assetIdType: typeof assetId,
    });

    if (!storyText.trim()) {
      throw new Error("Story text cannot be empty");
    }

    // LoRA 프롬프트 구성
    let loraPrompt = "";
    if (characterName && triggerWord) {
      loraPrompt = `${triggerWord}, ${characterName}`;
      console.log("✅ [SERVER DEBUG] LoRA 프롬프트 생성됨:", loraPrompt);
    } else {
      console.log(
        "❌ [SERVER DEBUG] LoRA 프롬프트 없음 - 캐릭터나 트리거워드 누락"
      );
    }

    // 한국어 프롬프트 영어 번역 (Leonardo API는 영어 프롬프트를 더 잘 이해함)
    let translatedStoryText = storyText;

    // 한국어가 포함되어 있는지 체크
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(storyText);
    console.log("🌐 [SERVER DEBUG] 한국어 감지:", hasKorean);

    if (hasKorean) {
      try {
        const openaiService = require("../services/openaiService");
        translatedStoryText = await openaiService.translateToEnglish(storyText);
        console.log("🔄 [SERVER DEBUG] 번역 완료:", {
          original: storyText,
          translated: translatedStoryText,
        });
      } catch (error) {
        console.warn("⚠️ [SERVER DEBUG] 번역 실패, 원본 사용:", error.message);
        translatedStoryText = storyText;
      }
    }

    // 최종 프롬프트 구성 (진짜 일본 애니메이션 스타일)
    const finalPrompt = loraPrompt
      ? `${loraPrompt}, ${translatedStoryText}, consistent character, same person, anime style, japanese animation, 2d anime, cel shading, manga style, detailed anime face, vibrant colors, anime lighting`
      : `${translatedStoryText}, anime style, japanese animation, 2d anime, cel shading, manga style, detailed anime face, vibrant colors, anime lighting`;

    console.log("📝 [SERVER DEBUG] 최종 프롬프트:", finalPrompt);

    logger.info("Generating image with Leonardo", {
      prompt: finalPrompt,
      characterName,
      triggerWord,
      assetId,
    });

    // Leonardo.ai API 호출 페이로드 (순수 애니메이션 설정)
    const payload = {
      prompt: finalPrompt,
      negative_prompt:
        "photorealistic, realistic, real person, photography, 3d render, blurry, deformed, ugly, bad anatomy, extra limbs, watermark, text, signature, multiple people, different person, inconsistent character, low quality",
      modelId: "e71a1c2f-4f80-4800-934f-2c68979d8cc8", // Leonardo Anime XL (애니메이션 특화)
      width: 1024,
      height: 1024,
      num_images: 1,
      guidance_scale: 7, // 애니메이션 스타일에 적합한 가이던스
      alchemy: true,
      photoReal: false, // 애니메이션이므로 비활성화
      styleUUID: "645e4195-f63d-4715-a3f2-3fb1e6eb8c70", // Illustration 스타일
    };

    // assetId가 있으면 커스텀 Element(LoRA) 사용
    if (assetId) {
      payload.userElements = [{ userLoraId: assetId, weight: 0.7 }]; // 가중치 조정으로 자연스러운 블렌딩
      console.log("🎯 [SERVER DEBUG] 커스텀 Element(LoRA) 추가됨:", {
        assetId,
        userElements: payload.userElements,
      });
    } else {
      console.log("⚠️ [SERVER DEBUG] 커스텀 Element 없음 - assetId가 없음");
    }

    console.log(
      "📡 [SERVER DEBUG] Leonardo API 페이로드:",
      JSON.stringify(payload, null, 2)
    );

    const generatedImageUrl = await leonardoService.generateImage(payload);

    logger.info("Image generated successfully", {
      imageUrl: generatedImageUrl,
      prompt: finalPrompt,
    });

    console.log("✅ [SERVER DEBUG] 이미지 생성 성공:", {
      imageUrl: generatedImageUrl,
      usedCharacter: !!characterName,
      usedTriggerWord: !!triggerWord,
      usedCustomModel: !!assetId,
    });

    res.json({
      success: true,
      imageUrl: generatedImageUrl,
      prompt: finalPrompt,
      characterName,
      triggerWord,
      assetId,
    });
  } catch (error) {
    console.error("❌ [SERVER DEBUG] 이미지 생성 오류:", error);
    handleError(res, error, "generate-image");
  }
});

// 사용자 Custom Element 목록 조회
router.get("/list-elements", async (req, res) => {
  try {
    logger.info("Fetching user custom elements");

    const userInfo = await leonardoService.getUserInfo();
    logger.info("User info received:", userInfo);

    const userId = userInfo.user_details?.[0]?.user?.id;
    logger.info("Extracted user ID:", userId);

    if (!userId) {
      throw new Error("Failed to get user ID from Leonardo API");
    }

    const customElements = await leonardoService.getUserElements(userId);
    logger.info("Raw custom elements from Leonardo:", {
      count: customElements.length,
      elements: customElements,
    });

    const formattedElements = customElements.map((element) => {
      const formatted = {
        ...element,
        thumbnailUrl: element.thumbnailUrl || null,
      };
      logger.info("Formatted element:", formatted);
      return formatted;
    });

    logger.info("Custom elements fetched successfully", {
      count: formattedElements.length,
      formattedElements: formattedElements,
    });

    res.json({
      success: true,
      elements: formattedElements,
      count: formattedElements.length,
    });
  } catch (error) {
    handleError(res, error, "list-elements");
  }
});

// Leonardo.ai 데이터셋 생성 엔드포인트
router.post("/create-dataset", async (req, res) => {
  try {
    validateRequiredFields(["name"], req.body);
    const { name, description } = req.body;

    logger.info("Creating Leonardo dataset", { name, description });

    const result = await leonardoService.createDataset(name, description);

    logger.info("Dataset created successfully", { datasetId: result.id });
    res.json({ ...result, success: true });
  } catch (error) {
    handleError(res, error, "create-dataset");
  }
});

// Leonardo.ai Custom Element 학습 시작 엔드포인트
router.post("/train-element", async (req, res) => {
  try {
    console.log("🎓 [TRAIN-ELEMENT DEBUG] 학습 요청 받음:", {
      body: req.body,
      bodyKeys: Object.keys(req.body || {}),
    });

    validateRequiredFields(["name", "datasetId", "instance_prompt"], req.body);

    const {
      name,
      description,
      datasetId,
      instance_prompt,
      lora_focus = "General", // 기본값 설정
      train_text_encoder = true,
      resolution = 1024,
      sd_version = "SDXL_1_0",
      num_train_epochs = 100,
      learning_rate = 0.000001,
    } = req.body;

    // Leonardo.ai API 문서에 맞는 유효한 lora_focus 값들 검증
    const validLoraFocusValues = [
      "General",
      "Character",
      "Object",
      "Style",
      "Product",
      "Face",
    ];

    if (!validLoraFocusValues.includes(lora_focus)) {
      throw new Error(
        `Invalid lora_focus value: ${lora_focus}. Must be one of: ${validLoraFocusValues.join(
          ", "
        )}`
      );
    }

    // Leonardo.ai API에 전송할 정확한 파라미터 구성
    const elementData = {
      name,
      description: description || `Custom LoRA for ${name}`,
      datasetId,
      instance_prompt,
      lora_focus,
      train_text_encoder,
      resolution,
      sd_version,
      num_train_epochs,
      learning_rate,
    };

    console.log("🎓 [TRAIN-ELEMENT DEBUG] Leonardo.ai API로 전송할 데이터:", {
      elementData,
      lora_focus_valid: validLoraFocusValues.includes(lora_focus),
    });

    logger.info("Starting element training", elementData);

    const result = await leonardoService.createElement(elementData);

    console.log("🎓 [TRAIN-ELEMENT DEBUG] Leonardo.ai API 응답:", result);

    logger.info("Element training started", {
      elementId: result.sdTrainingJob?.userLoraId,
      apiCreditCost: result.sdTrainingJob?.apiCreditCost,
    });

    res.json({ ...result, success: true });
  } catch (error) {
    console.error("🎓 [TRAIN-ELEMENT DEBUG] 학습 시작 실패:", error);
    handleError(res, error, "train-element");
  }
});

// Leonardo.ai Custom Element 삭제 엔드포인트
router.delete("/delete-element/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Element ID is required",
        operation: "delete-element",
      });
    }

    logger.info("Deleting custom element", { elementId: id });

    const result = await leonardoService.deleteElement(id);

    logger.info("Element deleted successfully", { elementId: id });
    res.json({ ...result, success: true });
  } catch (error) {
    handleError(res, error, "delete-element");
  }
});

// 특정 에셋의 상태만 조회하는 API (폴링 최적화)
router.get("/elements/:elementId", async (req, res) => {
  try {
    const { elementId } = req.params;

    if (!elementId) {
      return res.status(400).json({
        error: "Element ID is required",
        operation: "get-element-status",
      });
    }

    const element = await leonardoService.getElementStatus(elementId);

    res.json({
      success: true,
      element,
    });
  } catch (error) {
    handleError(res, error, "get-element-status");
  }
});

// 엘리먼트 상세 정보 조회 (dataset, images 포함)
router.get("/elements/:elementId/details", async (req, res) => {
  try {
    const { elementId } = req.params;

    if (!elementId) {
      return res.status(400).json({
        error: "Element ID is required",
        operation: "get-element-details",
      });
    }

    logger.info(`Getting element ${elementId} details`);
    const details = await leonardoService.getElementDetails(elementId);

    res.json({
      success: true,
      details,
    });
  } catch (error) {
    handleError(res, error, "get-element-details");
  }
});

// 사용자 데이터셋 목록 조회
router.get("/datasets", async (req, res) => {
  try {
    logger.info("Getting user datasets");

    const userInfo = await leonardoService.getUserInfo();
    const userId = userInfo.user_details?.[0]?.user?.id;

    if (!userId) {
      throw new Error("Failed to get user ID from Leonardo API");
    }

    const datasets = await leonardoService.getUserDatasets(userId);

    res.json({
      success: true,
      datasets,
      count: datasets.length,
    });
  } catch (error) {
    handleError(res, error, "get-user-datasets");
  }
});

// 서비스 상태 확인 엔드포인트
router.get("/health", async (req, res) => {
  try {
    logger.info("Leonardo health check started");

    const userInfo = await leonardoService.getUserInfo();
    logger.info("Leonardo user info:", userInfo);

    const userId = userInfo.user_details?.[0]?.user?.id;
    const username = userInfo.user_details?.[0]?.user?.username;

    logger.info("Leonardo health check successful", { userId, username });

    res.json({
      success: true,
      service: "Leonardo AI",
      status: "healthy",
      user: username || "Unknown",
      userId: userId,
      details: userInfo,
    });
  } catch (error) {
    logger.error("Leonardo health check failed", {
      error: error.message,
      stack: error.stack,
      response: error.response?.data,
    });
    res.status(503).json({
      success: false,
      service: "Leonardo AI",
      status: "unhealthy",
      error: error.message,
      details: error.response?.data,
    });
  }
});

// Get specific element details
router.get("/elements/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Element ${id} 상세 정보 요청 중...`);

    const elementDetails = await leonardoService.getElementDetails(id);
    console.log(
      `📋 Element ${id} 상세 응답:`,
      JSON.stringify(elementDetails, null, 2)
    );

    res.json({
      success: true,
      element: elementDetails,
    });
  } catch (error) {
    console.error(`❌ Element ${id} 상세 정보 가져오기 실패:`, error);
    res.status(500).json({
      success: false,
      error: "Element 상세 정보를 가져오는데 실패했습니다.",
      details: error.message,
    });
  }
});

// Get dataset information and images
router.get("/datasets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Dataset ${id} 정보 요청 중...`);

    const dataset = await leonardoService.getDatasetById(id);
    const images = await leonardoService.getDatasetImages(id);

    res.json({
      success: true,
      dataset: dataset,
      images: images,
      firstImageUrl: images && images.length > 0 ? images[0].url : null,
    });
  } catch (error) {
    console.error(`❌ Dataset ${id} 정보 가져오기 실패:`, error);
    res.status(500).json({
      success: false,
      error: "Dataset 정보를 가져오는데 실패했습니다.",
      details: error.message,
    });
  }
});

module.exports = router;
