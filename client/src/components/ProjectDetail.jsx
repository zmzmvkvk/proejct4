import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Card from "./Card";
import CardTitle from "./CardTitle";
import Input from "./Input";
import ErrorModal from "./ErrorModal";
import {
  Sparkles,
  BookText,
  Image,
  User,
  Clapperboard,
  Loader,
  PlusCircle,
  Trash2,
  AlertCircle,
  ArrowLeft,
} from "./Icons";
import StoryInput from "./StoryInput";
import CharacterManager from "./CharacterManager";
import StoryboardViewer from "./StoryboardViewer";
import TrainedAssetList from "./TrainedAssetList";
import ImageTrainingForm from "./ImageTrainingForm";

const ProjectDetail = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("training"); // 'training' 또는 'stories'

  // States for Story/Character/Image Generation
  const [story, setStory] = useState("");
  const [characters, setCharacters] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [generatingScene, setGeneratingScene] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // States for Trained Assets Management
  const [trainedAssets, setTrainedAssets] = useState([]); // 학습된 에셋 목록
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetsError, setAssetsError] = useState(null);
  const [assetFilter, setAssetFilter] = useState("all"); // 'all' 또는 'favorites'
  const [activeAssetId, setActiveAssetId] = useState(null); // 현재 활성화된 에셋 ID

  // 학습된 에셋 목록을 불러오는 함수 (TrainedAssetList, ImageTrainingForm에서 공통 사용)
  const fetchTrainedAssets = useCallback(async () => {
    try {
      setLoadingAssets(true);
      const response = await fetch("/api/list-elements");
      if (!response.ok) {
        throw new Error("학습된 에셋을 가져오는데 실패했습니다.");
      }
      const data = await response.json();
      const assets = data.map((element) => ({
        id: element.id,
        name: element.name,
        triggerWord: element.instancePrompt,
        category: element.loraFocus,
        status: element.status,
        imageUrl: element.urlImage ? element.urlImage : null,
        isFavorite: false,
        userLoraId: element.id,
      }));
      setTrainedAssets(assets);
      setAssetsError(null);
    } catch (err) {
      setAssetsError(err.message);
      console.error("Error fetching trained assets:", err);
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  // 좋아요 토글 함수
  const handleToggleLike = useCallback(
    async (id) => {
      try {
        const response = await fetch(`/api/assets/${id}/toggle-like`, {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error("좋아요 상태 변경 실패.");
        }
        const data = await response.json();
        setTrainedAssets((prevAssets) =>
          prevAssets.map((asset) =>
            asset.id === id ? { ...asset, isLiked: data.asset.isLiked } : asset
          )
        );
      } catch (err) {
        setErrorMessage(err.message);
        console.error("Error toggling like:", err);
      }
    },
    [setErrorMessage]
  );

  // 즐겨찾기 토글 함수
  const handleToggleFavorite = useCallback(
    async (id) => {
      try {
        const response = await fetch(`/api/assets/${id}/toggle-favorite`, {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error("즐겨찾기 상태 변경 실패.");
        }
        const data = await response.json();
        setTrainedAssets((prevAssets) =>
          prevAssets.map((asset) =>
            asset.id === id
              ? { ...asset, isFavorite: data.asset.isFavorite }
              : asset
          )
        );
      } catch (err) {
        setErrorMessage(err.message);
        console.error("Error toggling favorite:", err);
      }
    },
    [setErrorMessage]
  );

  // 컴포넌트 마운트 시 에셋 목록 불러오기
  useEffect(() => {
    fetchTrainedAssets();
  }, [fetchTrainedAssets]);

  // 스토리가 변경될 때 장면 목록을 업데이트
  useEffect(() => {
    const sceneDescriptions = story
      .split("---")
      .map((s) => s.trim())
      .filter(Boolean);
    setScenes((currentScenes) => {
      return sceneDescriptions.map((desc, index) => {
        const existingScene = currentScenes[index];
        return {
          description: desc,
          imageUrl: existingScene?.imageUrl || null,
        };
      });
    });
  }, [story]);

  // 보고서의 제안에 따라 Gemini API를 사용해 프롬프트를 강화하는 함수 (server proxy version)
  const enhancePromptWithGemini = useCallback(
    async (sceneDescription, mentionedAsset) => {
      try {
        const apiUrl = `/api/enhance-prompt`;
        const payload = {
          sceneDescription,
          character: mentionedAsset
            ? {
                name: mentionedAsset.name,
                description: `A character named ${mentionedAsset.name} with triggerWord ${mentionedAsset.triggerWord}`,
                referenceImage: mentionedAsset.imageUrl,
                triggerWord: mentionedAsset.triggerWord,
              }
            : null,
        };

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Gemini API error: ${response.status}\n${errorBody}`);
        }

        const result = await response.json();
        return result; // result should contain prompt and negative_prompt
      } catch (error) {
        console.error("Error enhancing prompt:", error);
        setErrorMessage(`프롬프트 강화 중 오류 발생: ${error.message}`);
        // Gemini 실패 시 기본 프롬프트 사용
        return {
          prompt: `3D Animation Style, cinematic, ${sceneDescription}`,
          negative_prompt: "blurry, ugly, deformed",
        };
      }
    },
    [setErrorMessage]
  );

  // Leonardo.ai에 URL로 이미지를 업로드하고 ID를 받아오는 함수 (server proxy version)
  const getLeonardoImageId = useCallback(async (imageUrl) => {
    if (!imageUrl) {
      throw new Error("Cannot upload image: URL is missing.");
    }
    const response = await fetch("/api/upload-reference-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: imageUrl }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Leonardo Upload Image Error Body:", errorBody);
      throw new Error(
        `Leonardo upload image from URL API error: ${response.status} - ${errorBody}`
      );
    }

    const result = await response.json();
    if (result?.id) {
      // Server response might return { id: "..." }
      return result.id;
    } else {
      throw new Error("Failed to get image ID from Leonardo upload response.");
    }
  }, []);

  // Leonardo.ai API를 호출하여 이미지를 생성하는 함수 (server proxy version)
  const generateImageWithLeonardo = useCallback(
    async (sceneIndex) => {
      setGeneratingScene(sceneIndex);

      try {
        const sceneDescription = scenes[sceneIndex].description;

        // 장면에 언급된 캐릭터 찾기
        const mentionedCharacter = characters.find((char) =>
          sceneDescription.includes(char.name)
        );

        let init_image_id = null;
        let userElements = [];

        if (mentionedCharacter && mentionedCharacter.referenceImage) {
          try {
            console.log(
              `Uploading reference image for ${mentionedCharacter.name}...`
            );
            init_image_id = await getLeonardoImageId(
              mentionedCharacter.referenceImage
            );
            console.log(`Obtained init_image_id: ${init_image_id}`);
          } catch (error) {
            console.error("Failed to upload reference image:", error);
            setErrorMessage(
              `참조 이미지 업로드 실패: ${error.message}\n\n프롬프트만으로 생성을 계속합니다.`
            );
          }
        }

        // Add userLoraId to userElements if available (from TrainingManager asset structure)
        if (mentionedCharacter && mentionedCharacter.userLoraId) {
          userElements.push({
            userLoraId: mentionedCharacter.userLoraId,
            weight: 1, // Default weight
          });
        }

        // 1. Gemini로 프롬프트 강화 (서버 API 호출)
        const { prompt, negative_prompt } = await enhancePromptWithGemini(
          sceneDescription,
          mentionedCharacter
        );
        console.log("Enhanced Prompt:", prompt);

        // 2. Leonardo.ai에 이미지 생성 요청 (서버 API 호출)
        const leoApiUrl = "/api/generate-image";

        const payload = {
          prompt: prompt,
          negative_prompt: negative_prompt,
          init_image_id: init_image_id,
          userElements: userElements,
        };

        const response = await fetch(leoApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error("Leonardo API Error Body (from server):", errorBody);
          throw new Error(
            `Leonardo API error (from server): ${response.status}\n\n${errorBody}`
          );
        }

        const result = await response.json();
        const generatedImageUrl = result.imageUrl; // Assuming server returns { imageUrl: "..." }

        if (!generatedImageUrl)
          throw new Error("Image generation timed out or failed.");

        // 3. 상태 업데이트
        setScenes((currentScenes) =>
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
    },
    [
      scenes,
      characters,
      enhancePromptWithGemini,
      getLeonardoImageId,
      setErrorMessage,
    ]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-lg flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl font-bold text-gray-100">
            AI 스토리 애니메이션 툴
          </h1>
        </div>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" /> 프로젝트 목록
        </Button>
      </header>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-700">
        <nav className="flex gap-4 px-4">
          <button
            onClick={() => setActiveTab("training")}
            className={`py-4 px-2 border-b-2 ${
              activeTab === "training"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            학습
          </button>
          <button
            onClick={() => setActiveTab("stories")}
            className={`py-4 px-2 border-b-2 ${
              activeTab === "stories"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            스토리
          </button>
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <main className="p-4 sm:p-6 md:p-8">
        {activeTab === "training" && (
          <div className="flex flex-col gap-8">
            {/* 이미지 학습 기능 */}
            <ImageTrainingForm
              fetchTrainedAssets={fetchTrainedAssets}
              setErrorMessage={setErrorMessage}
            />
            {/* 학습된 모든 에셋 목록 */}
            <TrainedAssetList
              trainedAssets={trainedAssets}
              loading={loadingAssets}
              error={assetsError}
              handleToggleLike={handleToggleLike}
              handleToggleFavorite={handleToggleFavorite}
              filter={assetFilter}
              setFilter={setAssetFilter}
              activeAssetId={activeAssetId}
              setActiveAssetId={setActiveAssetId}
              showFilterButtons={true}
            />
          </div>
        )}
        {activeTab === "stories" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽 패널: 스토리 및 캐릭터 관리 */}
            <div className="flex flex-col gap-8">
              <StoryInput story={story} setStory={setStory} />
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  즐겨찾기된 에셋
                </h3>
                <TrainedAssetList
                  assets={trainedAssets.filter((asset) => asset.isFavorite)}
                  onToggleFavorite={(assetId) => {
                    const updatedAssets = trainedAssets.map((asset) =>
                      asset.id === assetId
                        ? { ...asset, isFavorite: !asset.isFavorite }
                        : asset
                    );
                    setTrainedAssets(updatedAssets);
                  }}
                  simple
                />
              </div>
            </div>

            {/* 오른쪽 패널: 스토리보드 */}
            <div className="flex flex-col gap-8">
              <StoryboardViewer
                scenes={scenes}
                onGenerate={generateImageWithLeonardo}
                generatingScene={generatingScene}
              />
            </div>
          </div>
        )}
      </main>

      {/* Error Modal */}
      <ErrorModal
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
};

export default ProjectDetail;
