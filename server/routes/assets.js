const express = require("express");
const firestoreService = require("../services/firestoreService");
const leonardoService = require("../services/leonardoService");

const router = express.Router();

// 임시 인메모리 데이터 저장소 (좋아요 기능을 위한 백업)
let trainedAssets = [
  {
    id: "asset1",
    name: "엘라라",
    instancePrompt: "elara_character",
    loraFocus: "CHARACTER",
    status: "COMPLETE",
    url: "https://via.placeholder.com/150/0000FF/FFFFFF?text=Elara",
    isLiked: true,
    isFavorite: false,
    type: "CHARACTER",
  },
  {
    id: "asset2",
    name: "사이버펑크 도시 배경",
    instancePrompt: "cyberpunk_city",
    loraFocus: "BACKGROUND",
    status: "COMPLETE",
    url: "https://via.placeholder.com/150/FF0000/FFFFFF?text=CyberCity",
    isLiked: false,
    isFavorite: true,
    type: "BACKGROUND",
  },
  {
    id: "asset3",
    name: "플라잉 드론",
    instancePrompt: "flying_drone",
    loraFocus: "OBJECT",
    status: "COMPLETE",
    url: "https://via.placeholder.com/150/00FF00/FFFFFF?text=Drone",
    isLiked: true,
    isFavorite: true,
    type: "OBJECT",
  },
  {
    id: "asset4",
    name: "지포맨",
    instancePrompt: "g_po_man",
    loraFocus: "CHARACTER",
    status: "COMPLETE",
    url: "https://via.placeholder.com/150/FFFF00/000000?text=G-Po-Man",
    isLiked: false,
    isFavorite: false,
    type: "CHARACTER",
  },
  {
    id: "asset5",
    name: "아쿠아걸",
    instancePrompt: "aqua_girl",
    loraFocus: "CHARACTER",
    status: "COMPLETE",
    url: "https://via.placeholder.com/150/00FFFF/000000?text=Aqua-Girl",
    isLiked: false,
    isFavorite: false,
    type: "CHARACTER",
  },
];

// 전역 에셋 목록 불러오기
router.get("/", async (req, res) => {
  try {
    let assets = await firestoreService.getAllAssets();
    
    // Firestore에 없으면 Leonardo AI API에서 받아와서 저장
    if (assets.length === 0) {
      const userInfo = await leonardoService.getUserInfo();
      const userId = userInfo.user_details?.[0]?.user?.id;
      
      if (userId) {
        const leonardoElements = await leonardoService.getUserElements(userId);
        await firestoreService.saveAssetsFromLeonardo(leonardoElements);
        assets = await firestoreService.getAllAssets();
      }
    }
    
    res.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ error: error.message });
  }
});

// 에셋 좋아요/취소 엔드포인트 (임시 인메모리 데이터 사용)
router.post("/:id/toggle-like", (req, res) => {
  try {
    const { id } = req.params;

    // 먼저 인메모리 배열에서 찾기
    let assetIndex = trainedAssets.findIndex((asset) => asset.id === id);

    if (assetIndex === -1) {
      // 인메모리 배열에 없으면 새로 추가 (Leonardo API에서 가져온 에셋)
      const newAsset = {
        id: id,
        name: `Asset ${id}`,
        instancePrompt: `asset_${id}`,
        loraFocus: "CHARACTER",
        status: "COMPLETE",
        url: "https://via.placeholder.com/150/888888/FFFFFF?text=Asset",
        isLiked: false,
        isFavorite: false,
        type: "CHARACTER",
      };

      trainedAssets.push(newAsset);
      assetIndex = trainedAssets.length - 1;
    }

    // 좋아요 상태 토글
    trainedAssets[assetIndex].isLiked = !trainedAssets[assetIndex].isLiked;
    res.json({ success: true, asset: trainedAssets[assetIndex] });
  } catch (error) {
    console.error("Error toggling like status:", error);
    res.status(500).json({ error: "좋아요 상태 변경 실패." });
  }
});

// 에셋 즐겨찾기 토글 (Firestore 사용)
router.post("/:assetId/toggle-favorite", async (req, res) => {
  try {
    const { assetId } = req.params;
    const result = await firestoreService.toggleAssetFavorite(assetId);
    res.json(result);
  } catch (error) {
    console.error("Error toggling asset favorite:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;