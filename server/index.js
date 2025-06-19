const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// 임시 인메모리 데이터 저장소 (Prisma를 사용하지 않으므로 대체)
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

// Multer 설정: 메모리 스토리지 사용 (파일을 메모리에 임시 저장)
const upload = multer({ storage: multer.memoryStorage() });

// Leonardo.ai API 관련 엔드포인트

// (NEW) Leonardo.ai에 URL로 이미지를 업로드하고 ID를 받아오는 엔드포인트
app.post("/api/upload-reference-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const apiKey = process.env.LEONARDO_API_KEY;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is missing." });
    }

    const response = await axios.post(
      "https://cloud.leonardo.ai/api/rest/v1/images",
      { url: imageUrl },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.data?.uploadImage?.id) {
      throw new Error("Failed to get image ID from Leonardo upload response.");
    }

    res.json({ id: response.data.uploadImage.id });
  } catch (error) {
    console.error(
      "Error uploading reference image:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// (NEW) 학습용 이미지 업로드 엔드포인트
app.post(
  "/api/upload-training-image/:datasetId",
  upload.single("file"),
  async (req, res) => {
    try {
      const { datasetId } = req.params;
      const apiKey = process.env.LEONARDO_API_KEY;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      // 1. Leonardo.ai에 이미지 업로드 초기화 (Presigned URL 받기)
      const initUploadResponse = await axios.post(
        `https://cloud.leonardo.ai/api/rest/v1/datasets/${datasetId}/upload`,
        { extension: file.mimetype.split("/")[1] }, // 파일 확장자 추출
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const uploadData = initUploadResponse.data?.uploadDatasetImage;
      if (
        !uploadData ||
        !uploadData.url ||
        !uploadData.fields ||
        !uploadData.id
      ) {
        throw new Error("Failed to get presigned URL from Leonardo.ai.");
      }

      const { url: presignedUrl, fields: rawFields, id: imageId } = uploadData;
      const fields = JSON.parse(rawFields); // 필드 문자열을 JSON 객체로 파싱

      // 2. Presigned URL을 사용하여 S3에 이미지 업로드
      const formData = new FormData();
      for (const key in fields) {
        formData.append(key, fields[key]);
      }
      formData.append("file", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const s3UploadResponse = await axios.post(presignedUrl, formData, {
        headers: formData.getHeaders(),
      });

      if (s3UploadResponse.status !== 200 && s3UploadResponse.status !== 204) {
        throw new Error(
          `Failed to upload image to S3: ${s3UploadResponse.statusText}`
        );
      }

      res.json({ imageId, message: "Image uploaded successfully." });
    } catch (error) {
      console.error(
        "Error uploading training image:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({ error: error.message });
    }
  }
);

// (NEW) 캐릭터 기반 이미지 생성 엔드포인트
app.post("/api/generate-image", async (req, res) => {
  try {
    const { storyText, characterName } = req.body;
    const apiKey = process.env.LEONARDO_API_KEY;

    if (!storyText || storyText.trim() === "") {
      throw new Error("스토리 텍스트가 비어있습니다.");
    }

    // 캐릭터 프롬프트 매핑 (실제 훈련된 LoRA 모델에 맞게 설정)
    const characterPromptMap = {
      지포맨: "<lora:g_po_man:0.8>, g_po_man character",
      아쿠아걸: "<lora:aqua_girl:0.7>, aqua_girl character",
      엘라라: "<lora:elara_character:0.8>, elara_character",
      // 추가 캐릭터들은 여기에 추가
    };

    // 캐릭터 트리거 찾기
    const characterTrigger = characterName
      ? characterPromptMap[characterName]
      : null;

    // 최종 프롬프트 구성
    let finalPrompt;
    if (characterTrigger) {
      finalPrompt = `${characterTrigger}, ${storyText}, cinematic lighting, masterpiece, best quality, 3D Animation Style`;
    } else {
      finalPrompt = `${storyText}, cinematic lighting, masterpiece, best quality, 3D Animation Style`;
    }

    console.log("Final prompt for generation:", finalPrompt);

    // Leonardo.ai API 호출
    const response = await axios.post(
      "https://cloud.leonardo.ai/api/rest/v1/generations",
      {
        prompt: finalPrompt,
        negative_prompt:
          "blurry, deformed, ugly, bad anatomy, extra limbs, watermark, text, signature",
        modelId: "d69c8273-6b17-4a30-a13e-d6637ae1c644", // 3D Animation Style 모델
        width: 576,
        height: 1024,
        num_images: 1,
        guidance_scale: 8,
        alchemy: true,
        photoReal: false,
        presetStyle: "ANIME",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const generationId = response.data.sdGenerationJob.generationId;

    // 생성 완료될 때까지 폴링
    let generatedImageUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const pollResponse = await axios.get(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const jobStatus = pollResponse.data.generations_by_pk;
      if (jobStatus && jobStatus.status === "COMPLETE") {
        generatedImageUrl = jobStatus.generated_images[0].url;
        break;
      }
    }

    if (!generatedImageUrl) {
      throw new Error("이미지 생성이 시간 초과되었거나 실패했습니다.");
    }

    res.json({
      success: true,
      imageUrl: generatedImageUrl,
      prompt: finalPrompt,
      characterName: characterName,
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

// OpenAI API 관련 엔드포인트
app.post("/api/enhance-prompt", async (req, res) => {
  try {
    const { sceneDescription, character } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    let characterAnalysis = "";
    if (character && character.referenceImage) {
      // GPT-4o를 사용하여 캐릭터 이미지 분석
      const visionResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "이 캐릭터의 외모, 의상, 특징을 자세히 분석해주세요. 일본 애니메이션 스타일로 설명해주세요.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: character.referenceImage,
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      characterAnalysis = visionResponse.data.choices[0].message.content;
    }

    const promptContent = `You are a master prompt engineer for an AI image generator specializing in 3D animation and anime styles. Your task is to expand a simple scene description into a rich, detailed, and artistic prompt for the Leonardo AI API.\n\n**Style Guidelines:**\n- Style: 3D Animation Style, cinematic, epic, vibrant colors, dynamic lighting, high detail, masterpiece.\n- Artist/Studio Influence: Inspired by the styles of Studio Ghibli and Makoto Shinkai.\n- Negative Prompt: blurry, deformed, ugly, bad anatomy, extra limbs, watermark, text, signature.\n\n**Character for this scene:**\n${
      character
        ? `- ${character.name}: ${character.description} ${characterAnalysis}`
        : "No specific character for this scene."
    }\n\n**Scene Description to enhance:**\n\"${sceneDescription}\"\n\n**Your Task:**\n1. Analyze the \"Scene Description\".\n2. If a character is mentioned in the Character Sheet, you MUST incorporate their name and key visual traits into the final prompt.\n3. Generate a JSON object with \"prompt\" and \"negative_prompt\" keys. The \"prompt\" should be a detailed, comma-separated list of tags combining characters, actions, environment, and style. Keep the prompt concise and under 1000 characters.`;

    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o", // 또는 다른 적절한 모델
        messages: [{ role: "user", content: promptContent }],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const result = JSON.parse(openaiResponse.data.choices[0].message.content);

    res.json(result);
  } catch (error) {
    console.error(
      "Error enhancing prompt:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// 학습된 에셋 목록을 반환하는 엔드포인트 (Leonardo AI와 동기화)
app.get("/api/list-elements", async (req, res) => {
  try {
    const apiKey = process.env.LEONARDO_API_KEY;

    if (!apiKey) {
      console.error("LEONARDO_API_KEY is not set");
      return res
        .status(500)
        .json({ error: "Leonardo API key is not configured" });
    }

    // 1. 먼저 사용자 정보를 가져와서 userId를 얻습니다
    const userResponse = await axios.get(
      "https://cloud.leonardo.ai/api/rest/v1/me",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    console.log("User response:", userResponse.data);

    // Leonardo API의 실제 응답 구조에 맞게 userId 추출
    const userId = userResponse.data.user_details?.[0]?.user?.id;
    console.log("User ID:", userId);

    if (!userId) {
      console.error("Failed to get user ID from Leonardo API");
      return res
        .status(500)
        .json({ error: "Failed to get user ID from Leonardo API" });
    }

    // 2. 사용자 ID로 Custom Element 목록을 가져옵니다
    const elementsResponse = await axios.get(
      `https://cloud.leonardo.ai/api/rest/v1/elements/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    console.log("Custom Elements API 응답:", elementsResponse.data);

    // Custom Element 목록 반환 (user_loras 배열)
    const customElements = (elementsResponse.data.user_loras || []).map(
      (element) => ({
        ...element,
        thumbnailUrl: element.thumbnailUrl || null, // 썸네일 필드가 있으면 사용, 없으면 null
      })
    );
    res.json(customElements);
  } catch (error) {
    console.error(
      "Error fetching custom elements:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// (NEW) 에셋 좋아요/취소 엔드포인트
app.post("/api/assets/:id/toggle-like", (req, res) => {
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

// (NEW) 에셋 즐겨찾기/취소 엔드포인트
app.post("/api/assets/:id/toggle-favorite", (req, res) => {
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

    // 즐겨찾기 상태 토글
    trainedAssets[assetIndex].isFavorite =
      !trainedAssets[assetIndex].isFavorite;
    res.json({ success: true, asset: trainedAssets[assetIndex] });
  } catch (error) {
    console.error("Error toggling favorite status:", error);
    res.status(500).json({ error: "즐겨찾기 상태 변경 실패." });
  }
});

// (NEW) Leonardo.ai 데이터셋 생성 엔드포인트
app.post("/api/create-dataset", async (req, res) => {
  try {
    const { name, description } = req.body;
    const apiKey = process.env.LEONARDO_API_KEY;
    const response = await axios.post(
      "https://cloud.leonardo.ai/api/rest/v1/datasets",
      {
        name,
        description,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error creating dataset:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// (NEW) Leonardo.ai Custom Element 학습 시작 엔드포인트
app.post("/api/train-element", async (req, res) => {
  try {
    const apiKey = process.env.LEONARDO_API_KEY;
    const response = await axios.post(
      "https://cloud.leonardo.ai/api/rest/v1/elements",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error training custom element:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// (NEW) Leonardo.ai Custom Element 삭제 엔드포인트
app.delete("/api/delete-element/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.LEONARDO_API_KEY;

    const response = await axios.delete(
      `https://cloud.leonardo.ai/api/rest/v1/elements/${id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error deleting custom element:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// GPT-4o Vision 기반 이미지 캡션 생성 엔드포인트
app.post("/api/vision-caption", upload.single("file"), async (req, res) => {
  try {
    const { characterName } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded." });

    // 이미지를 base64로 인코딩
    const base64Image = file.buffer.toString("base64");
    const prompt = `Describe this image in one sentence.\n- Always include the character/object name: <${characterName}>.\n- Clearly state the pose, facial expression, emotion, scene mood, and style (e.g., flat color, thick outline).\n- Example: "<gfm_014x> is standing with arms raised, smiling joyfully. The emotion is happiness. The scene is simple. Style: flat color, thick outline."\n- Write in English.`;

    // GPT-4o Vision API 호출
    const openaiRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.mimetype};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const caption = openaiRes.data.choices[0].message.content.trim();
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
app.post("/api/gpt-description", async (req, res) => {
  try {
    const { prompt } = req.body;
    const openaiRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 60,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    const description = openaiRes.data.choices[0].message.content.trim();
    res.json({ description });
  } catch (error) {
    console.error(
      "GPT description error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// [NEW] 특정 에셋의 상태만 조회하는 API 추가 (폴링 최적화)
app.get("/api/elements/:elementId", async (req, res) => {
  try {
    const { elementId } = req.params;
    const apiKey = process.env.LEONARDO_API_KEY;

    const response = await axios.get(
      `https://cloud.leonardo.ai/api/rest/v1/elements/${elementId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    // user_elements 배열의 첫 번째 항목(요청한 에셋 정보)을 클라이언트로 보냄
    res.json(response.data.user_elements[0] || null);
  } catch (error) {
    console.error(
      "Error fetching single element status:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to fetch element status" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
