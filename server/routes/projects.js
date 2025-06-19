const express = require("express");
const firestoreService = require("../services/firestoreService");
const leonardoService = require("../services/leonardoService");

const router = express.Router();

// 프로젝트 목록 불러오기
router.get("/", async (req, res) => {
  console.log("[LOG] /api/projects GET 요청 들어옴");
  try {
    const projects = await firestoreService.getAllProjects();
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: error.message });
  }
});

// 프로젝트 생성
router.post("/", async (req, res) => {
  console.log("[LOG] /api/projects POST 요청 들어옴");
  try {
    const { name } = req.body;
    const project = await firestoreService.createProject({ name });
    res.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: error.message });
  }
});

// 프로젝트 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await firestoreService.deleteProject(id);
    res.json(result);
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: error.message });
  }
});

// 특정 프로젝트의 에셋 목록 불러오기
router.get("/:projectId/assets", async (req, res) => {
  try {
    const { projectId } = req.params;
    let assets = await firestoreService.getProjectAssets(projectId);
    
    // Firestore에 없으면 Leonardo AI API에서 받아와서 저장
    if (assets.length === 0) {
      const userInfo = await leonardoService.getUserInfo();
      const userId = userInfo.user_details?.[0]?.user?.id;
      
      if (userId) {
        const leonardoElements = await leonardoService.getUserElements(userId);
        await firestoreService.saveProjectAssetsFromLeonardo(projectId, leonardoElements);
        assets = await firestoreService.getProjectAssets(projectId);
      }
    }
    
    res.json(assets);
  } catch (error) {
    console.error("Error fetching project assets:", error);
    res.status(500).json({ error: error.message });
  }
});

// 특정 프로젝트에 에셋 생성
router.post("/:projectId/assets", async (req, res) => {
  try {
    const { projectId } = req.params;
    const assetData = req.body;
    const asset = await firestoreService.createProjectAsset(projectId, assetData);
    res.json(asset);
  } catch (error) {
    console.error("Error creating project asset:", error);
    res.status(500).json({ error: error.message });
  }
});

// 특정 프로젝트의 에셋 즐겨찾기 토글
router.post("/:projectId/assets/:assetId/toggle-favorite", async (req, res) => {
  try {
    const { projectId, assetId } = req.params;
    const result = await firestoreService.toggleProjectAssetFavorite(projectId, assetId);
    res.json(result);
  } catch (error) {
    console.error("Error toggling project asset favorite:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;