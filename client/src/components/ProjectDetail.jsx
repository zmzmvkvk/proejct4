import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import Button from "./Button";
import ImageTrainingForm from "./ImageTrainingForm";
import TrainedAssetList from "./TrainedAssetList";
import StoryManager from "./StoryManager";
import * as assetApi from "../services/assetApi";
import * as projectApi from "../services/projectApi";
import toast from "../utils/toast";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [activeTab, setActiveTab] = useState("training");
  const [trainedAssets, setTrainedAssets] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previousAssets, setPreviousAssets] = useState([]);

  // 프로젝트 정보 불러오기
  const fetchProject = useCallback(async () => {
    if (!projectId) return;

    try {
      const data = await projectApi.fetchProject(projectId);
      const projectData = data?.project || data;
      setProject(projectData);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("프로젝트 정보를 불러오는데 실패했습니다.");
      // 프로젝트를 찾을 수 없는 경우 홈으로 리다이렉트
      if (error.message.includes("not found")) {
        navigate("/");
      }
    }
  }, [projectId, navigate]);

  // Leonardo AI에서 직접 에셋 목록 불러오기
  const fetchTrainedAssets = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setRefreshing(true);

      console.log("🔄 에셋 목록 불러오기 시작...");

      // 직접 Leonardo AI에서 데이터 가져오기
      console.log("🎯 Leonardo AI에서 직접 데이터 가져오는 중...");
      const leonardoData = await assetApi.fetchLeonardoElements();

      console.log("📦 Leonardo AI 데이터 받음:", leonardoData);

      if (leonardoData.assets && leonardoData.assets.length > 0) {
        // 학습 완료된 에셋 체크 (수동 새로고침 시에만)
        if (showLoading) {
          const newlyCompletedAssets = leonardoData.assets.filter(
            (newAsset) => {
              const previousAsset = previousAssets.find(
                (prev) => prev.id === newAsset.id
              );
              return (
                previousAsset &&
                previousAsset.status !== "COMPLETE" &&
                newAsset.status === "COMPLETE"
              );
            }
          );

          // 새로 완료된 에셋이 있으면 알림
          newlyCompletedAssets.forEach((asset) => {
            toast.success(`🎉 "${asset.name}" 에셋 학습이 완료되었습니다!`);
          });
        }

        setTrainedAssets(leonardoData.assets);
        setPreviousAssets(leonardoData.assets);

        if (showLoading) {
          // 수동 새로고침인 경우에만 메시지 표시
          toast.success(
            `Leonardo AI에서 ${leonardoData.assets.length}개의 에셋을 불러왔습니다.`
          );
        }
        console.log("✅ UI에 에셋 설정 완료:", leonardoData.assets);
      } else {
        setTrainedAssets([]);
        setPreviousAssets([]);
        if (showLoading) {
          toast.info("Leonardo AI에 학습된 에셋이 없습니다.");
        }
      }
    } catch (error) {
      console.error("❌ Leonardo AI 에셋 불러오기 실패:", error);
      toast.error(`에셋 목록을 불러오는데 실패했습니다: ${error.message}`);
      setTrainedAssets([]);
    } finally {
      if (showLoading) setRefreshing(false);
    }
  }, []);

  // 즐겨찾기 토글
  const handleToggleFavorite = useCallback(async (id) => {
    try {
      const data = await assetApi.toggleAssetFavorite(id);
      const updatedAsset = data?.asset || data;

      setTrainedAssets((prevAssets) =>
        prevAssets.map((asset) =>
          asset.id === id
            ? { ...asset, isFavorite: updatedAsset.isFavorite }
            : asset
        )
      );

      toast.success(
        updatedAsset.isFavorite
          ? "즐겨찾기에 추가되었습니다."
          : "즐겨찾기에서 제거되었습니다."
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("즐겨찾기 상태 변경에 실패했습니다.");
    }
  }, []);

  // 에셋 새로고침
  const handleRefresh = useCallback(() => {
    fetchTrainedAssets(true);
  }, [fetchTrainedAssets]);

  // Leonardo AI 연결 테스트
  const testLeonardoConnection = async () => {
    try {
      setRefreshing(true);
      console.log("🔍 Leonardo AI 연결 테스트 시작...");

      const response = await fetch("/api/leonardo/health");
      const data = await response.json();

      console.log("🏥 Leonardo AI Health Check:", data);

      if (data.success) {
        toast.success(`Leonardo AI 연결 성공! 사용자: ${data.user}`);

        // 실제 elements 가져오기 테스트
        const elementsResponse = await fetch("/api/leonardo/list-elements");
        const elementsData = await elementsResponse.json();

        console.log("📋 Leonardo Elements 응답:", elementsData);
        toast.info(
          `Leonardo AI에서 ${
            elementsData.elements?.length || 0
          }개의 에셋을 찾았습니다.`
        );
      } else {
        toast.error(`Leonardo AI 연결 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Leonardo AI 연결 테스트 실패:", error);
      toast.error(`연결 테스트 실패: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchProject(), fetchTrainedAssets()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchProject, fetchTrainedAssets]);

  // 자동 새로고침 비활성화 (Leonardo AI API 요청 제한 때문에)
  // 대신 사용자가 수동으로 새로고침 버튼을 클릭하거나 새 에셋 학습 시에만 업데이트
  /*
  useEffect(() => {
    const hasTrainingAssets = trainedAssets.some(
      (asset) =>
        asset.status === "TRAINING" ||
        asset.status === "PENDING" ||
        asset.status === "PROCESSING"
    );

    if (!hasTrainingAssets) return;

    console.log("🔄 학습 중인 에셋이 있어서 자동 새로고침을 시작합니다.");

    const interval = setInterval(() => {
      console.log("⏰ 자동 새로고침 실행 중...");
      fetchTrainedAssets(false); // 로딩 스피너 없이 조용히 새로고침
    }, 60000); // 60초마다 새로고침 (요청 빈도 줄임)

    return () => {
      console.log("🛑 자동 새로고침을 중단합니다.");
      clearInterval(interval);
    };
  }, [trainedAssets, fetchTrainedAssets]);
  */

  // 프로젝트 ID가 없는 경우
  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            잘못된 프로젝트 접근
          </h1>
          <Button onClick={() => navigate("/")}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 탭 설정 - 캐릭터 관리 제거
  const tabs = [
    { id: "training", label: "학습 관리", icon: "🎯" },
    { id: "story", label: "스토리 & 스토리보드", icon: "🎬" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>프로젝트 목록</span>
              </Button>

              <div className="h-6 border-l border-gray-300" />

              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {project?.name || "프로젝트"}
                </h1>
                {project?.description && (
                  <p className="text-sm text-gray-500">{project.description}</p>
                )}
              </div>
            </div>

            {/* 새로고침 버튼 */}
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                onClick={testLeonardoConnection}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>🔗</span>
                )}
                <span>연결테스트</span>
              </Button>

              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>🔄</span>
                )}
                <span>새로고침</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "training" && (
          <div className="space-y-8">
            <ImageTrainingForm onAssetCreated={fetchTrainedAssets} />
            <TrainedAssetList
              assets={trainedAssets}
              onToggleFavorite={handleToggleFavorite}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {activeTab === "story" && (
          <StoryManager trainedAssets={trainedAssets} />
        )}
      </main>
    </div>
  );
};

export default ProjectDetail;
