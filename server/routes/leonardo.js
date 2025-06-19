const express = require("express");
const multer = require("multer");
const leonardoService = require("../services/leonardoService");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Leonardo.ai에 URL로 이미지를 업로드하고 ID를 받아오는 엔드포인트
router.post("/upload-reference-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const imageId = await leonardoService.uploadReferenceImage(imageUrl);
    res.json({ id: imageId });
  } catch (error) {
    console.error(
      "Error uploading reference image:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// 학습용 이미지 업로드 엔드포인트
router.post("/upload-training-image/:datasetId", upload.single("file"), async (req, res) => {
  try {
    const { datasetId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const imageId = await leonardoService.uploadTrainingImage(datasetId, file);
    res.json({ imageId, message: "Image uploaded successfully." });
  } catch (error) {
    console.error(
      "Error uploading training image:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// 캐릭터 기반 이미지 생성 엔드포인트
router.post("/generate-image", async (req, res) => {
  try {
    const { storyText, characterName, triggerWord, assetId } = req.body;

    if (!storyText || storyText.trim() === "") {
      throw new Error("스토리 텍스트가 비어있습니다.");
    }

    // LoRA 프롬프트: 트리거워드, 캐릭터명
    let loraPrompt = "";
    if (characterName && triggerWord) {
      loraPrompt = `${triggerWord}, ${characterName}`;
    }

    // 최종 프롬프트
    let finalPrompt = loraPrompt
      ? `${loraPrompt}, ${storyText}, cinematic lighting, masterpiece, best quality, 3D Animation Style`
      : `${storyText}, cinematic lighting, masterpiece, best quality, 3D Animation Style`;

    console.log("=== [Leonardo 이미지 생성 요청] ===");
    console.log("프롬프트:", finalPrompt);
    console.log("characterName:", characterName, "triggerWord:", triggerWord, "assetId:", assetId);

    // Leonardo.ai API 호출 페이로드
    const payload = {
      prompt: finalPrompt,
      negative_prompt: "blurry, deformed, ugly, bad anatomy, extra limbs, watermark, text, signature",
      modelId: "d69c8273-6b17-4a30-a13e-d6637ae1c644",
      width: 576,
      height: 1024,
      num_images: 1,
      guidance_scale: 8,
      alchemy: true,
      photoReal: false,
      presetStyle: "ANIME",
    };

    const generatedImageUrl = await leonardoService.generateImage(payload);

    res.json({
      success: true,
      imageUrl: generatedImageUrl,
      prompt: finalPrompt,
      characterName,
      triggerWord,
      assetId,
    });
  } catch (error) {
    console.error(
      "Error generating image:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: error.message,
      details: error.response ? error.response.data : null,
    });
  }
});

// 사용자 Custom Element 목록 조회
router.get("/list-elements", async (req, res) => {
  try {
    const userInfo = await leonardoService.getUserInfo();
    const userId = userInfo.user_details?.[0]?.user?.id;

    if (!userId) {
      console.error("Failed to get user ID from Leonardo API");
      return res.status(500).json({ error: "Failed to get user ID from Leonardo API" });
    }

    const customElements = await leonardoService.getUserElements(userId);
    
    const formattedElements = customElements.map((element) => ({
      ...element,
      thumbnailUrl: element.thumbnailUrl || null,
    }));
    
    res.json(formattedElements);
  } catch (error) {
    console.error(
      "Error fetching custom elements:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// Leonardo.ai 데이터셋 생성 엔드포인트
router.post("/create-dataset", async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await leonardoService.createDataset(name, description);
    res.json(result);
  } catch (error) {
    console.error(
      "Error creating dataset:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// Leonardo.ai Custom Element 학습 시작 엔드포인트
router.post("/train-element", async (req, res) => {
  try {
    const result = await leonardoService.createElement(req.body);
    res.json(result);
  } catch (error) {
    console.error(
      "Error training custom element:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// Leonardo.ai Custom Element 삭제 엔드포인트
router.delete("/delete-element/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await leonardoService.deleteElement(id);
    res.json(result);
  } catch (error) {
    console.error(
      "Error deleting custom element:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// 특정 에셋의 상태만 조회하는 API (폴링 최적화)
router.get("/elements/:elementId", async (req, res) => {
  try {
    const { elementId } = req.params;
    const element = await leonardoService.getElementStatus(elementId);
    res.json(element);
  } catch (error) {
    console.error(
      "Error fetching single element status:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to fetch element status" });
  }
});

module.exports = router;