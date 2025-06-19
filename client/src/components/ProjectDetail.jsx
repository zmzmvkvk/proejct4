import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Card from "./Card";
import CardTitle from "./CardTitle";
import Input from "./Input";
import ErrorModal from "./ErrorModal";
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
  const [scenes, setScenes] = useState([]);
  const [generatingScene, setGeneratingScene] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [detectedCharacter, setDetectedCharacter] = useState(null);
  const [characterData, setCharacterData] = useState(null);

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

      // [FINAL FIX] API 응답 데이터의 실제 키 이름과 일치시켰습니다.
      const assets = data.map((element) => ({
        id: element.id,
        name: element.name,
        triggerWord: element.instancePrompt,
        category: element.focus, // 'loraFocus' -> 'focus'
        status: element.status,
        imageUrl: element.thumbnailUrl, // 'url' 또는 'urlImage' -> 'thumbnailUrl'
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

  // 캐릭터 감지 콜백 함수
  const handleCharacterDetected = useCallback((character, data) => {
    setDetectedCharacter(character);
    setCharacterData(data);
  }, []);

  // 컴포넌트 마운트 시 에셋 목록 불러오기
  useEffect(() => {
    fetchTrainedAssets();
  }, [fetchTrainedAssets]);

  // Leonardo.ai API를 호출하여 이미지를 생성하는 함수 (새로운 캐릭터 기반 API 사용)
  const generateImageWithLeonardo = useCallback(
    async (sceneIndex, detectedCharacter) => {
      setGeneratingScene(sceneIndex);

      try {
        const sceneDescription = scenes[sceneIndex].description;

        // 새로운 API 엔드포인트 호출
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storyText: sceneDescription,
            characterName: detectedCharacter,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error("Image generation API Error:", errorBody);
          throw new Error(
            `이미지 생성 API 오류: ${response.status}\n\n${errorBody}`
          );
        }

        const result = await response.json();
        const generatedImageUrl = result.imageUrl;

        if (!generatedImageUrl) {
          throw new Error("이미지 생성이 실패했습니다.");
        }

        // 상태 업데이트
        setScenes((currentScenes) =>
          currentScenes.map((s, i) =>
            i === sceneIndex ? { ...s, imageUrl: generatedImageUrl } : s
          )
        );

        console.log("Image generated successfully:", {
          sceneIndex,
          characterName: detectedCharacter,
          prompt: result.prompt,
        });
      } catch (error) {
        console.error("Error generating image:", error);
        setErrorMessage(`이미지 생성 중 오류 발생: ${error.message}`);
      } finally {
        setGeneratingScene(null);
      }
    },
    [scenes, setErrorMessage]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-lg flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-100">
            AI 스토리 애니메이션 툴
          </h1>
        </div>
        <Button onClick={() => navigate("/")}>← 프로젝트 목록</Button>
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
              assets={trainedAssets}
              loading={loadingAssets}
              error={assetsError}
              handleToggleLike={handleToggleLike}
              onToggleFavorite={handleToggleFavorite}
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
              <StoryInput
                story={story}
                setStory={setStory}
                trainedAssets={trainedAssets}
                onCharacterDetected={handleCharacterDetected}
              />
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  즐겨찾기된 에셋
                </h3>
                <TrainedAssetList
                  assets={trainedAssets.filter((a) => a.status === "COMPLETE")}
                  onToggleFavorite={handleToggleFavorite}
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
                detectedCharacter={detectedCharacter}
                characterData={characterData}
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
