import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState("training");

  // States for Story/Character/Image Generation
  const [story, setStory] = useState("");
  const [characters, setCharacters] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [generatingScene, setGeneratingScene] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // States for Trained Assets Management
  const [trainedAssets, setTrainedAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetsError, setAssetsError] = useState(null);
  const [assetFilter, setAssetFilter] = useState("all");
  const [activeAssetId, setActiveAssetId] = useState(null);

  // Firestore에서 에셋 목록 불러오기 (전역)
  const fetchTrainedAssets = useCallback(async () => {
    try {
      setLoadingAssets(true);
      const response = await fetch(`/api/assets`);
      if (!response.ok) {
        throw new Error("에셋을 가져오는데 실패했습니다.");
      }
      const data = await response.json();
      setTrainedAssets(data);
      setAssetsError(null);
    } catch (err) {
      setAssetsError(err.message);
      console.error("Error fetching trained assets:", err);
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  // Firestore에 에셋 추가 함수 예시 (필요시 사용)
  const addAssetToFirestore = async (assetData) => {
    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assetData),
    });
    if (res.ok) {
      const newAsset = await res.json();
      setTrainedAssets((prev) => [...prev, newAsset]);
    }
  };

  // 즐겨찾기 토글 함수 (전역)
  const handleToggleFavorite = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/assets/${id}/toggle-favorite`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setTrainedAssets((prevAssets) =>
          prevAssets.map((asset) =>
            asset.id === id
              ? { ...asset, isFavorite: data.asset.isFavorite }
              : asset
          )
        );
      } else {
        alert("즐겨찾기 상태 변경에 실패했습니다.");
      }
    } catch (e) {
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  }, []);

  // 컴포넌트 마운트 시 에셋 목록 불러오기
  useEffect(() => {
    fetchTrainedAssets();
  }, [fetchTrainedAssets]);

  // 스토리/에셋 변경 시 장면별 참조 에셋 계산
  useEffect(() => {
    const sceneDescriptions = story
      .split("---")
      .map((s) => s.trim())
      .filter(Boolean);

    const favoriteAssets = trainedAssets.filter((asset) => asset.isFavorite);

    setScenes((currentScenes) => {
      return sceneDescriptions.map((desc, index) => {
        const existingScene = currentScenes[index];
        const referencedAssets = favoriteAssets.filter((asset) =>
          desc.includes(asset.name)
        );
        return {
          description: desc,
          imageUrl: existingScene?.imageUrl || null,
          referencedAssets,
        };
      });
    });
  }, [story, trainedAssets]);

  // 이미지 생성 함수 (참조 에셋 중 첫 번째를 주요 캐릭터로 사용)
  const generateImageWithLeonardo = useCallback(
    async (sceneIndex) => {
      setGeneratingScene(sceneIndex);
      try {
        const scene = scenes[sceneIndex];
        const sceneDescription = scene.description;
        const primaryAsset =
          scene.referencedAssets && scene.referencedAssets[0];

        // primaryAsset 정보를 API에 포함해서 전달
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyText: sceneDescription,
            characterName: primaryAsset ? primaryAsset.name : null,
            triggerWord: primaryAsset ? primaryAsset.triggerWord : null,
            assetId: primaryAsset ? primaryAsset.id : null,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `이미지 생성 API 오류: ${response.status}\n\n${errorBody}`
          );
        }

        const result = await response.json();
        const generatedImageUrl = result.imageUrl;
        if (!generatedImageUrl) throw new Error("이미지 생성이 실패했습니다.");
        setScenes((currentScenes) =>
          currentScenes.map((s, i) =>
            i === sceneIndex ? { ...s, imageUrl: generatedImageUrl } : s
          )
        );
      } catch (error) {
        setErrorMessage(`이미지 생성 중 오류 발생: ${error.message}`);
      } finally {
        setGeneratingScene(null);
      }
    },
    [scenes]
  );

  // TrainedAssetList에 넘길 때 asset 구조 맞추기 (id, name, triggerWord, category, status, imageUrl, isFavorite)
  const mappedAssets = trainedAssets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    triggerWord: asset.triggerWord || asset.instancePrompt,
    category: asset.category || asset.focus,
    status: asset.status,
    imageUrl: asset.imageUrl || "",
    isFavorite: asset.isFavorite || false,
  }));

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
            <ImageTrainingForm
              fetchTrainedAssets={fetchTrainedAssets}
              setErrorMessage={setErrorMessage}
            />
            <TrainedAssetList
              assets={mappedAssets}
              onToggleFavorite={handleToggleFavorite}
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
              />
            </div>
          </div>
        )}
      </main>
      <ErrorModal
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
};

export default ProjectDetail;
