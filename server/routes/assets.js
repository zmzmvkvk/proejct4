const express = require("express");
const leonardoService = require("../services/leonardoService");
const logger = require("../config/logger");

const router = express.Router();

// firestoreService를 지연 로딩하는 함수
const getFirestoreService = () => {
  return require("../services/firestoreService");
};

// 입력 검증 헬퍼 함수
const validateRequiredFields = (fields, body) => {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

// 에러 응답 헬퍼 함수
const handleError = (res, error, operation) => {
  logger.error(`Assets API Error - ${operation}`, {
    error: error.message,
    stack: error.stack,
  });

  const statusCode = error.status || 500;
  res.status(statusCode).json({
    error: error.message,
    operation,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
};

// 전역 에셋 목록 불러오기
router.get("/", async (req, res) => {
  try {
    logger.info("Fetching all global assets");

    const firestoreService = getFirestoreService();
    let assets = await firestoreService.getAllAssets();

    // Firestore에 없으면 Leonardo AI API에서 받아와서 저장
    if (assets.length === 0) {
      logger.info("No assets found in Firestore, fetching from Leonardo AI");

      try {
        const userInfo = await leonardoService.getUserInfo();
        const userId = userInfo.user_details?.[0]?.user?.id;

        if (userId) {
          const leonardoElements = await leonardoService.getUserElements(
            userId
          );
          await firestoreService.saveAssetsFromLeonardo(leonardoElements);
          assets = await firestoreService.getAllAssets();

          logger.info("Assets fetched and saved from Leonardo AI", {
            count: assets.length,
          });
        }
      } catch (leonardoError) {
        logger.warn("Failed to fetch assets from Leonardo AI", {
          error: leonardoError.message,
        });
        // Leonardo AI 에러는 무시하고 빈 배열 반환
      }
    }

    logger.info("Global assets fetched successfully", {
      count: assets.length,
    });
    res.json({
      success: true,
      assets,
      count: assets.length,
    });
  } catch (error) {
    handleError(res, error, "get-assets");
  }
});

// 에셋 즐겨찾기 토글
router.post("/:id/toggle-favorite", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Asset ID is required",
        operation: "toggle-asset-favorite",
      });
    }

    logger.info("Toggling asset favorite", { assetId: id });

    const firestoreService = getFirestoreService();
    const asset = await firestoreService.toggleAssetFavorite(id);

    logger.info("Asset favorite toggled successfully", {
      assetId: id,
      isFavorite: asset.isFavorite,
    });
    res.json({
      success: true,
      asset,
    });
  } catch (error) {
    handleError(res, error, "toggle-asset-favorite");
  }
});

// 에셋 생성
router.post("/", async (req, res) => {
  try {
    validateRequiredFields(["name", "type"], req.body);

    logger.info("Creating new asset", { assetData: req.body });

    const firestoreService = getFirestoreService();
    const asset = await firestoreService.createAsset({
      ...req.body,
      createdAt: new Date().toISOString(),
    });

    logger.info("Asset created successfully", { assetId: asset.id });
    res.status(201).json({
      success: true,
      asset,
    });
  } catch (error) {
    handleError(res, error, "create-asset");
  }
});

// 에셋 수정
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        error: "Asset ID is required",
        operation: "update-asset",
      });
    }

    logger.info("Updating asset", { assetId: id, updates });

    const firestoreService = getFirestoreService();
    const asset = await firestoreService.updateAsset(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    logger.info("Asset updated successfully", { assetId: id });
    res.json({
      success: true,
      asset,
    });
  } catch (error) {
    handleError(res, error, "update-asset");
  }
});

// 에셋 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Asset ID is required",
        operation: "delete-asset",
      });
    }

    logger.info("Deleting asset", { assetId: id });

    const firestoreService = getFirestoreService();
    const result = await firestoreService.deleteAsset(id);

    logger.info("Asset deleted successfully", { assetId: id });
    res.json({
      success: true,
      message: "Asset deleted successfully",
      ...result,
    });
  } catch (error) {
    handleError(res, error, "delete-asset");
  }
});

module.exports = router;
