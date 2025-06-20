const axios = require("axios");

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = "https://api.openai.com/v1";
  }

  async analyzeCharacterImage(referenceImage) {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
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
                  url: referenceImage,
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
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  async enhancePrompt(sceneDescription, character) {
    let characterAnalysis = "";
    if (character && character.referenceImage) {
      characterAnalysis = await this.analyzeCharacterImage(
        character.referenceImage
      );
    }

    const promptContent = `You are a master prompt engineer for an AI image generator specializing in 3D animation and anime styles. Your task is to expand a simple scene description into a rich, detailed, and artistic prompt for the Leonardo AI API.

**Style Guidelines:**
- Style: 3D Animation Style, cinematic, epic, vibrant colors, dynamic lighting, high detail, masterpiece.
- Artist/Studio Influence: Inspired by the styles of Studio Ghibli and Makoto Shinkai.
- Negative Prompt: blurry, deformed, ugly, bad anatomy, extra limbs, watermark, text, signature.

**Character for this scene:**
${
  character
    ? `- ${character.name}: ${character.description} ${characterAnalysis}`
    : "No specific character for this scene."
}

**Scene Description to enhance:**
"${sceneDescription}"

**Your Task:**
1. Analyze the "Scene Description".
2. If a character is mentioned in the Character Sheet, you MUST incorporate their name and key visual traits into the final prompt.
3. Generate a JSON object with "prompt" and "negative_prompt" keys. The "prompt" should be a detailed, comma-separated list of tags combining characters, actions, environment, and style. Keep the prompt concise and under 1000 characters.`;

    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: promptContent }],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  }

  async generateVisionCaption(imageBuffer, mimetype, characterName) {
    const base64Image = imageBuffer.toString("base64");
    const prompt = `Describe this image in one sentence.
- Always include the character/object name: <${characterName}>.
- Clearly state the pose, facial expression, emotion, scene mood, and style (e.g., flat color, thick outline).
- Example: "<gfm_014x> is standing with arms raised, smiling joyfully. The emotion is happiness. The scene is simple. Style: flat color, thick outline."
- Write in English.`;

    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
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
                  url: `data:${mimetype};base64,${base64Image}`,
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
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  async generateDescription(prompt) {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 60,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  async translateToEnglish(koreanText) {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `Translate the following Korean text to English for use in an AI image generation prompt. Focus on visual descriptions and maintain the scene's atmosphere. Keep character names as they are.

Korean text: "${koreanText}"

Provide only the English translation without any additional explanation.`,
          },
        ],
        max_tokens: 200,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  }
}

module.exports = new OpenAIService();
