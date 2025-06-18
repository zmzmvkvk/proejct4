## 예시 코드

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// 아이콘 라이브러리 (Lucide React)
const icons = {
Sparkles: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="m3 5 2.8 2.8"/><path d="m15.2 18.8 2.8 2.8"/><path d="M3 19v-4"/><path d="M17 5v4"/><path d="m5 19-2.8-2.8"/><path d="m18.8 8.8-2.8-2.8"/></svg>,
User: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
BookText: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>,
Clapperboard: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m20.2 6-2.3 2.3"/><path d="M18 8.5 22 12"/><path d="m15.5 15-3.3 3.3"/><path d="M13.5 13.5 18 9"/><path d="M20 2 2 20"/><path d="M4.8 15.5 2 13"/><path d="m8 12.5-3.3-3.3"/><path d="m6 10.5 4.5-4.5"/></svg>,
Settings: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.23l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0-2.23l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
Image: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
Loader: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/><line x1="4.93" x2="7.76" y1="4.93" y2="7.76"/><line x1="16.24" x2="19.07" y1="16.24" y2="19.07"/><line x1="2" x2="6" y1="12" y2="12"/><line x1="18" x2="22" y1="12" y2="12"/><line x1="4.93" x2="7.76" y1="19.07" y2="16.24"/><line x1="16.24" x2="19.07" y1="7.76" y2="4.93"/></svg>,
PlusCircle: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>,
Trash2: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="m8 6 1-4h6l1 4"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
AlertCircle: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
};

// 재사용 가능한 UI 컴포넌트
const Button = ({ children, onClick, className = '', disabled = false }) => (
<button
onClick={onClick}
disabled={disabled}
className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${className} ${disabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}

>

    {children}

  </button>
);

const Input = ({ value, onChange, placeholder, type = 'text', className = '' }) => (
<input
type={type}
value={value}
onChange={onChange}
placeholder={placeholder}
className={`w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
/>
);

const Card = ({ children, className = '' }) => (

  <div className={`bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ Icon, title }) => (

  <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-3">
    <Icon className="w-6 h-6 text-indigo-400" />
    <span>{title}</span>
  </h2>
);

// 컴포넌트: 설정 (API 키 입력)
const Settings = ({ apiKey, setApiKey, isVisible, onClose }) => {
if (!isVisible) return null;
return (

<div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm">
<div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
<h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
<icons.Settings className="w-7 h-7 text-indigo-400" />
API 설정
</h2>
<p className="text-gray-400 mb-4">
이미지 생성을 위해 Leonardo.ai API 키가 필요합니다.
</p>
<Input
value={apiKey}
onChange={(e) => setApiKey(e.target.value)}
placeholder="Leonardo.ai API 키를 입력하세요"
type="password"
/>
<div className="mt-6 flex justify-end">
<Button onClick={onClose}>닫기</Button>
</div>
</div>
</div>
);
};

// 컴포넌트: 에러 메시지 모달
const ErrorModal = ({ message, onClose }) => {
if (!message) return null;
return (

<div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm">
<div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-red-500">
<h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-3">
<icons.AlertCircle className="w-7 h-7" />
오류 발생
</h2>
<p className="text-gray-300 mb-6 whitespace-pre-wrap">{message}</p>
<div className="mt-6 flex justify-end">
<Button onClick={onClose} className="bg-red-600 hover:bg-red-700">닫기</Button>
</div>
</div>
</div>
);
};

// 컴포넌트: 캐릭터 관리
const CharacterManager = ({ characters, setCharacters }) => {
const [newCharName, setNewCharName] = useState('');
const [newCharRef, setNewCharRef] = useState('');

const addCharacter = () => {
if (newCharName.trim() === '' || newCharRef.trim() === '') return;
const newCharacter = {
id: Date.now(),
name: newCharName,
referenceImage: newCharRef,
description: `A character named ${newCharName}` // Simple description for prompt context
};
setCharacters([...characters, newCharacter]);
setNewCharName('');
setNewCharRef('');
};

const deleteCharacter = (id) => {
setCharacters(characters.filter(c => c.id !== id));
};

return (
<Card>
<CardTitle Icon={icons.User} title="캐릭터 관리" />

<div className="space-y-4">
{characters.map(char => (
<div key={char.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
<div className="flex items-center gap-3">
{char.referenceImage ? (
<img src={char.referenceImage} alt={char.name} className="w-10 h-10 rounded-full object-cover" />
) : (
<div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
<icons.User className="w-6 h-6 text-gray-400" />
</div>
)}
<span className="font-semibold text-gray-200">{char.name}</span>
</div>
<button onClick={() => deleteCharacter(char.id)} className="text-gray-400 hover:text-red-500">
<icons.Trash2 className="w-5 h-5" />
</button>
</div>
))}
</div>
<div className="mt-6 space-y-3">
<Input value={newCharName} onChange={(e) => setNewCharName(e.target.value)} placeholder="새 캐릭터 이름" />
<Input value={newCharRef} onChange={(e) => setNewCharRef(e.target.value)} placeholder="참조 이미지 URL (필수)" />
<Button onClick={addCharacter} className="w-full">
<icons.PlusCircle className="w-5 h-5" /> 캐릭터 추가
</Button>
</div>
</Card>
);
};

// 컴포넌트: 스토리 입력
const StoryInput = ({ story, setStory }) => {

const exampleStory = `SCENE 1
주인공 엘라라가 네온 불빛이 가득한 사이버펑크 도시의 뒷골목으로 들어선다. 비가 내리고 바닥은 젖어있다.

---

SCENE 2
엘라라는 거대한 감시 드론을 발견하고, 재빨리 그림자 속으로 몸을 숨긴다. 긴장감이 흐른다.

---

SCENE 3
드론이 지나간 후, 엘라라는 비밀스러운 문에 다가가 홀로그램 잠금장치를 해제하려고 시도한다.`;

const loadExample = () => {
setStory(exampleStory);
};

return (
<Card>

<div className="flex justify-between items-center mb-4">
<CardTitle Icon={icons.BookText} title="스토리 작성" />
<button onClick={loadExample} className="text-sm text-indigo-400 hover:text-indigo-300">예제 불러오기</button>
</div>
<p className="text-sm text-gray-400 mb-4">
'---'를 사용해서 장면(Scene)을 구분해주세요. 각 장면은 하나의 이미지로 생성됩니다.
</p>
<textarea
value={story}
onChange={(e) => setStory(e.target.value)}
placeholder="여기에 당신의 이야기를 작성하세요..."
className="w-full h-96 p-3 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 leading-relaxed"
/>
</Card>
);
};

// 컴포넌트: 스토리보드 뷰어
const StoryboardViewer = ({ scenes, onGenerate, generatingScene }) => {
return (
<Card className="flex-grow">
<CardTitle Icon={icons.Clapperboard} title="스토리보드" />

<div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
{scenes.map((scene, index) => (
<div key={index} className="flex gap-4 items-start border-b border-gray-700 pb-6 last:border-b-0">
<div className="w-2/5 flex-shrink-0">
<div className="bg-gray-900 p-4 rounded-lg h-full flex flex-col justify-between">
<div>
<h3 className="font-bold text-lg text-indigo-300 mb-2">SCENE {index + 1}</h3>
<p className="text-gray-300 text-sm leading-6">{scene.description}</p>
</div>
<Button
onClick={() => onGenerate(index)}
className="w-full mt-4"
disabled={generatingScene !== null} >
{generatingScene === index ? (
<>
<icons.Loader className="w-5 h-5 animate-spin" /> 생성 중...
</>
) : (
<>
<icons.Sparkles className="w-5 h-5" /> 이미지 생성
</>
)}
</Button>
</div>
</div>
<div className="w-3/5">
<div className="aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700">
{generatingScene === index && !scene.imageUrl && (
<div className="text-center text-gray-400">
<icons.Loader className="w-12 h-12 animate-spin mx-auto mb-2" />
<p>AI가 이미지를 생성하고 있습니다...</p>
</div>
)}
{scene.imageUrl && (
<img
src={scene.imageUrl}
alt={`Scene ${index + 1}`}
className="w-full h-full object-cover rounded-lg"
onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/1280x720/1f2937/9ca3af?text=Error`; }}
/>
)}
{!generatingScene && !scene.imageUrl && (
<div className="text-center text-gray-500">
<icons.Image className="w-12 h-12 mx-auto mb-2" />
<p>생성된 이미지가 여기에 표시됩니다.</p>
</div>
)}
</div>
</div>
</div>
))}
</div>
</Card>
);
};

// 메인 앱 컴포넌트
export default function App() {
const [apiKey, setApiKey] = useState('');
const [story, setStory] = useState('');
const [characters, setCharacters] = useState([]);
const [scenes, setScenes] = useState([]);
const [generatingScene, setGeneratingScene] = useState(null);
const [isSettingsVisible, setIsSettingsVisible] = useState(true);
const [errorMessage, setErrorMessage] = useState(null);

// 스토리가 변경될 때 장면 목록을 업데이트
useEffect(() => {
const sceneDescriptions = story.split('---').map(s => s.trim()).filter(Boolean);
setScenes(currentScenes => {
return sceneDescriptions.map((desc, index) => {
const existingScene = currentScenes[index];
return {
description: desc,
imageUrl: existingScene?.imageUrl || null
};
});
});
}, [story]);

// API 키가 없으면 설정 창을 띄움
useEffect(() => {
if (apiKey) {
setIsSettingsVisible(false);
} else {
setIsSettingsVisible(true);
}
}, [apiKey]);

// 보고서의 제안에 따라 Gemini API를 사용해 프롬프트를 강화하는 함수
const enhancePromptWithGemini = async (sceneDescription, character) => {
const charSheet = character ? `- ${character.name}: ${character.description}` : "No specific character for this scene.";

      const userPrompt = `You are a master prompt engineer for an AI image generator specializing in 3D animation and anime styles. Your task is to expand a simple scene description into a rich, detailed, and artistic prompt for the Leonardo AI API.

      **Style Guidelines:**
      - Style: 3D Animation Style, cinematic, epic, vibrant colors, dynamic lighting, high detail, masterpiece.
      - Artist/Studio Influence: Inspired by the styles of Studio Ghibli and Makoto Shinkai.
      - Negative Prompt: blurry, deformed, ugly, bad anatomy, extra limbs, watermark, text, signature.

      **Character for this scene:**
      ${charSheet}

      **Scene Description to enhance:**
      "${sceneDescription}"

      **Your Task:**
      1. Analyze the "Scene Description".
      2. If a character is mentioned in the Character Sheet, you MUST incorporate their name and key visual traits into the final prompt.
      3. Generate a JSON object with "prompt" and "negative_prompt" keys. The "prompt" should be a detailed, comma-separated list of tags combining characters, actions, environment, and style. Keep the prompt concise and under 1000 characters.
      `;

      try {
        const geminiApiKey = ""; // Gemini API는 Canvas 환경에서 자동으로 키를 처리합니다.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "prompt": { "type": "STRING" },
                        "negative_prompt": { "type": "STRING" }
                    },
                    required: ["prompt", "negative_prompt"]
                }
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API error: ${response.status}\n${errorBody}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            return JSON.parse(text);
        } else {
            throw new Error("Invalid response structure from Gemini API.");
        }
      } catch (error) {
        console.error("Error enhancing prompt:", error);
        setErrorMessage(`프롬프트 강화 중 오류 발생: ${error.message}`);
        // Gemini 실패 시 기본 프롬프트 사용
        return {
          prompt: `3D Animation Style, cinematic, ${sceneDescription}`,
          negative_prompt: "blurry, ugly, deformed"
        };
      }

};

// (FIXED) Leonardo.ai에 URL로 이미지를 업로드하고 ID를 받아오는 함수
const getLeonardoImageId = async (imageUrl, apiKey) => {
if (!imageUrl) {
throw new Error("Cannot upload image: URL is missing.");
}
const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/images', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${apiKey}`,
},
body: JSON.stringify({ url: imageUrl }),
});

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Leonardo Upload Image Error Body:", errorBody);
        throw new Error(`Leonardo upload image from URL API error: ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    if (result?.uploadImage?.id) {
        return result.uploadImage.id;
    } else {
        throw new Error("Failed to get image ID from Leonardo upload response.");
    }

};

// Leonardo.ai API를 호출하여 이미지를 생성하는 함수
const generateImageWithLeonardo = useCallback(async (sceneIndex) => {
if (!apiKey) {
setErrorMessage('Leonardo.ai API 키를 설정에서 입력해주세요.');
setIsSettingsVisible(true);
return;
}
setGeneratingScene(sceneIndex);

    try {
      const sceneDescription = scenes[sceneIndex].description;

      // 장면에 언급된 캐릭터 찾기
      const mentionedCharacter = characters.find(char => sceneDescription.includes(char.name));

      let init_image_id = null;
      if (mentionedCharacter && mentionedCharacter.referenceImage) {
          try {
              console.log(`Uploading reference image for ${mentionedCharacter.name}...`);
              init_image_id = await getLeonardoImageId(mentionedCharacter.referenceImage, apiKey);
              console.log(`Obtained init_image_id: ${init_image_id}`);
          } catch (error) {
              console.error("Failed to upload reference image:", error);
              setErrorMessage(`참조 이미지 업로드 실패: ${error.message}\n\n프롬프트만으로 생성을 계속합니다.`);
          }
      }

      // 1. Gemini로 프롬프트 강화
      const { prompt, negative_prompt } = await enhancePromptWithGemini(sceneDescription, mentionedCharacter);
      console.log("Enhanced Prompt:", prompt);

      // 2. Leonardo.ai에 이미지 생성 요청
      const leoApiUrl = 'https://cloud.leonardo.ai/api/rest/v1/generations';

      const payload = {
        prompt: prompt,
        negative_prompt: negative_prompt,
        modelId: "d69c8273-6b17-4a30-a13e-d6637ae1c644", // 3D Animation Style
        width: 1024,
        height: 576,
        num_images: 1,
        guidance_scale: 7,
        alchemy: true,
        photoReal: false,
        presetStyle: 'CINEMATIC',
        ...(init_image_id && { init_image_id: init_image_id }),
        ...(init_image_id && { init_strength: 0.5 }),
      };

      const response = await fetch(leoApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Leonardo API Error Body:", errorBody);
        throw new Error(`Leonardo API error: ${response.status}\n\n${errorBody}`);
      }

      const generationJob = await response.json();
      const generationId = generationJob.sdGenerationJob.generationId;

      // 3. 생성 완료될 때까지 폴링
      let generatedImageUrl = null;
      for (let i = 0; i < 30; i++) { // 최대 30회 시도 (약 2.5분)
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기

        const pollResponse = await fetch(`${leoApiUrl}/${generationId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const pollResult = await pollResponse.json();

        const jobStatus = pollResult.generations_by_pk;
        if (jobStatus && jobStatus.status === 'COMPLETE') {
          generatedImageUrl = jobStatus.generated_images[0].url;
          break;
        }
      }

      if (!generatedImageUrl) throw new Error("Image generation timed out or failed.");

      // 4. 상태 업데이트
      setScenes(currentScenes =>
        currentScenes.map((s, i) =>
          i === sceneIndex ? { ...s, imageUrl: generatedImageUrl } : s
        )
      );

    } catch (error) {
      console.error("Error generating image:", error);
      setErrorMessage(`이미지 생성 중 오류 발생: ${error.message}`);
    } finally {
      setGeneratingScene(null);
    }

}, [apiKey, scenes, characters]);

return (

<div className="bg-gray-900 text-white min-h-screen font-sans">
<header className="bg-gray-800 p-4 shadow-lg flex justify-between items-center border-b border-gray-700">
<div className="flex items-center gap-3">
<icons.Sparkles className="w-8 h-8 text-indigo-400"/>
<h1 className="text-2xl font-bold text-gray-100">AI 스토리 애니메이션 툴</h1>
</div>
<Button onClick={() => setIsSettingsVisible(true)}>
<icons.Settings className="w-5 h-5"/>
설정
</Button>
</header>

      <main className="p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽 패널: 스토리 및 캐릭터 관리 */}
          <div className="flex flex-col gap-8">
            <StoryInput story={story} setStory={setStory} />
            <CharacterManager characters={characters} setCharacters={setCharacters} />
          </div>

          {/* 오른쪽 패널: 스토리보드 */}
          <div>
            <StoryboardViewer scenes={scenes} onGenerate={generateImageWithLeonardo} generatingScene={generatingScene} />
          </div>
        </div>
      </main>

      <Settings
        apiKey={apiKey}
        setApiKey={setApiKey}
        isVisible={isSettingsVisible}
        onClose={() => apiKey && setIsSettingsVisible(false)}
      />

      <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
    </div>

);
}

##AI 스토리 애니메이션 툴 UI/UX 구조도

현재 앱은 사용자가 [① 아이디어 구상 → ② AI를 통한 시각화 → ③ 결과 확인 및 반복] 의 창작 흐름을 원활하게 따라갈 수 있도록 설계되었습니다. 전체 화면은 크게 **입력 패널(좌측)**과 결과 패널(우측), 그리고 설정 및 알림 시스템으로 구성되어 있습니다.

1. 전체 화면 레이아웃 (Layout)

화면은 크게 2개의 세로 열로 나뉩니다.

좌측 (입력 및 제어 영역): 사용자가 창작에 필요한 모든 정보를 입력하는 공간입니다.

스토리 작성: 이야기의 전체 스크립트를 작성하고 수정합니다.

캐릭터 관리: 이야기에 등장할 캐릭터를 정의하고 관리합니다.

우측 (시각화 및 결과 영역): AI가 생성한 시각적 결과물을 확인하는 공간입니다.

스토리보드: 스토리에 맞춰 생성된 장면 이미지들을 순서대로 보여줍니다.

2. 사용자 경험 흐름 (User Experience Flow)

사용자는 다음과 같은 단계를 거쳐 애니메이션의 핵심 장면들을 만들어나갑니다.

1단계: 초기 설정 (Onboarding)

앱을 처음 실행하면, API 키를 입력하는 **설정 모달(팝업창)**이 먼저 나타납니다.

사용자는 이곳에 Leonardo.ai와 OpenAI의 API 키를 입력해야 모든 기능을 사용할 수 있습니다. 이는 사용자가 자신의 계정으로 창작 활동을 시작하기 위한 필수 과정입니다.

2단계: 창작 입력 (Creative Input)

캐릭터 정의: 좌측의 '캐릭터 관리' 패널에서 캐릭터의 이름과 참조 이미지 URL을 입력하여 캐릭터를 추가합니다. 이는 이후 이미지 생성 시 AI에게 캐릭터의 외모 정보를 알려주는 역할을 합니다.

스토리 작성: '스토리 작성' 패널의 텍스트 에디터에 애니메이션의 줄거리를 작성합니다. 각 장면은 --- 구분자로 나누어 작성하며, 장면 묘사에는 미리 정의한 캐릭터의 이름을 포함시킵니다.

3단계: AI 생성 및 검토 (Generation & Review)

개별 장면 생성: 우측 '스토리보드' 패널에는 작성된 스크리브가 장면별로 나뉘어 표시됩니다. 사용자는 각 장면 카드에 있는 '이미지 생성' 버튼을 눌러 원하는 장면만 개별적으로 생성할 수 있습니다.

시각적 피드백: 생성이 시작되면, 버튼과 이미지 영역에 로딩 아이콘이 나타나 AI가 작업 중임을 명확하게 알려줍니다.

결과 확인: 생성이 완료되면, 해당 장면 카드에 AI가 그린 이미지가 나타납니다. 사용자는 스크롤하며 전체 스토리보드의 흐름을 시각적으로 확인할 수 있습니다.

4단계: 수정 및 반복 (Iteration)

결과물이 마음에 들지 않으면, 언제든지 '이미지 생성' 버튼을 다시 눌러 새로운 이미지를 얻거나, 좌측 '스토리 작성' 패널에서 해당 장면의 묘사를 수정하여 더 나은 결과물을 유도할 수 있습니다.

오류 처리: API 키가 잘못되었거나 네트워크 문제 발생 시, **오류 모달(팝업창)**이 나타나 사용자에게 상황을 명확하게 알려줍니다.

사용자 UI옵션 설정은 드롭다운이나 샐랙트가 아니라 카드 형태로 나열되고 클릭 시 선택값이 활성화 되는 형식으로 만들어주세요.

3. 핵심 UI 구성 요소 (UI Components)

설정 모달: Leonardo.ai와 OpenAI의 API 키를 입력하는 2개의 입력 필드.

스토리 작성 카드: 제목, 안내 문구, 장면을 입력하는 넓은 텍스트 에디터.

캐릭터 관리 카드: 제목, 등록된 캐릭터 목록(이미지, 이름, 삭제 버튼), 새 캐릭터를 추가하는 입력 필드와 버튼.

스토리보드 패널: 스크롤 가능한 영역 안에 여러 개의 '장면 카드'가 세로로 나열됨.

장면 카드:

정보 영역 (좌): 장면 번호, 장면 묘사 텍스트, '이미지 생성' 버튼.

시각 영역 (우): 이미지 생성 전에는 플레이스홀더, 생성 중에는 로딩 애니메이션, 생성 후에는 결과 이미지가 표시됨.

이러한 구조를 통해 사용자는 복잡한 AI 기술을 직관적으로 제어하며, 자신의 아이디어를 체계적으로 시각화하고 발전시켜 나갈 수 있습니다.

이 구조도를 내가 직접 프로젝트 셋팅까지 할거기때문에 api는 env파일에 적어 둘거고 leonardo ai api와 chat gpt는 노드 js로 할거야 그걸 참고해서 구조도 만들어줘
