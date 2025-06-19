const express = require("express");
const multer = require("multer");
const openaiService = require("../services/openaiService");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 프롬프트 강화 엔드포인트
router.post("/enhance-prompt", async (req, res) => {
  try {
    const { sceneDescription, character } = req.body;
    const result = await openaiService.enhancePrompt(sceneDescription, character);
    res.json(result);
  } catch (error) {
    console.error(
      "Error enhancing prompt:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// GPT-4o Vision 기반 이미지 캡션 생성 엔드포인트
router.post("/vision-caption", upload.single("file"), async (req, res) => {
  try {
    const { characterName } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const caption = await openaiService.generateVisionCaption(
      file.buffer,
      file.mimetype,
      characterName
    );
    
    res.json({ caption });
  } catch (error) {
    console.error(
      "Vision caption error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// GPT-4o 기반 description 생성 엔드포인트
router.post("/gpt-description", async (req, res) => {
  try {
    const { prompt } = req.body;
    const description = await openaiService.generateDescription(prompt);
    res.json({ description });
  } catch (error) {
    console.error(
      "GPT description error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;