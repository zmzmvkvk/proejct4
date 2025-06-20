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
  logger.error(`Projects API Error - ${operation}`, {
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

// 프로젝트 목록 불러오기
router.get("/", async (req, res) => {
  try {
    logger.info("Fetching all projects");

    const firestoreService = getFirestoreService();
    const projects = await firestoreService.getAllProjects();

    logger.info("Projects fetched successfully", { count: projects.length });
    res.json({
      success: true,
      projects,
      count: projects.length,
    });
  } catch (error) {
    handleError(res, error, "get-projects");
  }
});

// 프로젝트 생성
router.post("/", async (req, res) => {
  try {
    validateRequiredFields(["name"], req.body);
    const { name, description } = req.body;

    logger.info("Creating new project", { name, description });

    const firestoreService = getFirestoreService();
    const project = await firestoreService.createProject({
      name,
      description: description || "",
      createdAt: new Date().toISOString(),
    });

    logger.info("Project created successfully", { projectId: project.id });
    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    handleError(res, error, "create-project");
  }
});

// 특정 프로젝트 조회
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Project ID is required",
        operation: "get-project",
      });
    }

    logger.info("Fetching project", { projectId: id });

    const firestoreService = getFirestoreService();
    const project = await firestoreService.getProject(id);

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
        operation: "get-project",
      });
    }

    logger.info("Project fetched successfully", { projectId: id });
    res.json({
      success: true,
      project,
    });
  } catch (error) {
    handleError(res, error, "get-project");
  }
});

// 프로젝트 수정
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        error: "Project ID is required",
        operation: "update-project",
      });
    }

    logger.info("Updating project", { projectId: id, updates });

    const firestoreService = getFirestoreService();
    const project = await firestoreService.updateProject(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    logger.info("Project updated successfully", { projectId: id });
    res.json({
      success: true,
      project,
    });
  } catch (error) {
    handleError(res, error, "update-project");
  }
});

// 프로젝트 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Project ID is required",
        operation: "delete-project",
      });
    }

    logger.info("Deleting project", { projectId: id });

    const firestoreService = getFirestoreService();
    const result = await firestoreService.deleteProject(id);

    logger.info("Project deleted successfully", { projectId: id });
    res.json({
      success: true,
      message: "Project deleted successfully",
      ...result,
    });
  } catch (error) {
    handleError(res, error, "delete-project");
  }
});

// 특정 프로젝트의 에셋 목록 불러오기
router.get("/:projectId/assets", async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        error: "Project ID is required",
        operation: "get-project-assets",
      });
    }

    logger.info("Fetching project assets", { projectId });

    const firestoreService = getFirestoreService();
    let assets = await firestoreService.getProjectAssets(projectId);

    // Firestore에 없으면 Leonardo AI API에서 받아와서 저장
    if (assets.length === 0) {
      logger.info("No assets found in Firestore, fetching from Leonardo AI", {
        projectId,
      });

      try {
        const userInfo = await leonardoService.getUserInfo();
        const userId = userInfo.user_details?.[0]?.user?.id;

        if (userId) {
          const leonardoElements = await leonardoService.getUserElements(
            userId
          );
          await firestoreService.saveProjectAssetsFromLeonardo(
            projectId,
            leonardoElements
          );
          assets = await firestoreService.getProjectAssets(projectId);

          logger.info("Assets fetched and saved from Leonardo AI", {
            projectId,
            count: assets.length,
          });
        }
      } catch (leonardoError) {
        logger.warn("Failed to fetch assets from Leonardo AI", {
          projectId,
          error: leonardoError.message,
        });
        // Leonardo AI 에러는 무시하고 빈 배열 반환
      }
    }

    logger.info("Project assets fetched successfully", {
      projectId,
      count: assets.length,
    });
    res.json({
      success: true,
      assets,
      count: assets.length,
    });
  } catch (error) {
    handleError(res, error, "get-project-assets");
  }
});

// 프로젝트에 새 에셋 추가
router.post("/:projectId/assets", async (req, res) => {
  try {
    const { projectId } = req.params;
    validateRequiredFields(["name"], req.body);

    if (!projectId) {
      return res.status(400).json({
        error: "Project ID is required",
        operation: "create-project-asset",
      });
    }

    logger.info("Creating project asset", { projectId, assetData: req.body });

    const firestoreService = getFirestoreService();
    const asset = await firestoreService.createProjectAsset(projectId, {
      ...req.body,
      createdAt: new Date().toISOString(),
    });

    logger.info("Project asset created successfully", {
      projectId,
      assetId: asset.id,
    });
    res.status(201).json({
      success: true,
      asset,
    });
  } catch (error) {
    handleError(res, error, "create-project-asset");
  }
});

// 프로젝트 에셋 즐겨찾기 토글
router.post("/:projectId/assets/:assetId/toggle-favorite", async (req, res) => {
  try {
    const { projectId, assetId } = req.params;

    if (!projectId || !assetId) {
      return res.status(400).json({
        error: "Project ID and Asset ID are required",
        operation: "toggle-project-asset-favorite",
      });
    }

    logger.info("Toggling project asset favorite", { projectId, assetId });

    const firestoreService = getFirestoreService();
    const asset = await firestoreService.toggleProjectAssetFavorite(
      projectId,
      assetId
    );

    logger.info("Project asset favorite toggled successfully", {
      projectId,
      assetId,
      isFavorite: asset.isFavorite,
    });
    res.json({
      success: true,
      asset,
    });
  } catch (error) {
    handleError(res, error, "toggle-project-asset-favorite");
  }
});

// 프로젝트 통계
router.get("/:projectId/stats", async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        error: "Project ID is required",
        operation: "get-project-stats",
      });
    }

    logger.info("Fetching project stats", { projectId });

    const firestoreService = getFirestoreService();
    const stats = await firestoreService.getProjectStats(projectId);

    logger.info("Project stats fetched successfully", { projectId, stats });
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    handleError(res, error, "get-project-stats");
  }
});

module.exports = router;
