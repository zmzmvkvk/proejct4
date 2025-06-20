import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookText, Clapperboard } from "./Icons";
import Card from "./Card";
import CardTitle from "./CardTitle";
import Button from "./Button";
import useDebounce from "../hooks/useDebounce";
import * as leonardoApi from "../services/leonardoApi";
import toast from "../utils/toast";

const StoryManager = ({ trainedAssets = [] }) => {
  const [story, setStory] = useState("");
  const [scenes, setScenes] = useState([]);
  const [generatingScene, setGeneratingScene] = useState(null);
  const [detectedAssets, setDetectedAssets] = useState([]);

  // 디바운스된 스토리 텍스트 (500ms 지연)
  const debouncedStory = useDebounce(story, 500);

  // 사전 훈련된 에셋 목록을 useMemo로 메모이제이션
  const TRAINED_ASSETS = useMemo(
    () => trainedAssets.filter((asset) => asset.status === "COMPLETE"),
    [trainedAssets]
  );

  // 초기 렌더링 시 props 데이터 확인
  useEffect(() => {
    console.log("🎯 [DEBUG] StoryManager 초기화");
    console.log("📦 [DEBUG] 받은 trainedAssets props:", trainedAssets);
    console.log(
      "🔍 [DEBUG] TRAINED_ASSETS 최종값 (COMPLETE만):",
      TRAINED_ASSETS
    );
    console.log("📊 [DEBUG] 상태별 에셋 분류:", {
      total: trainedAssets.length,
      complete: trainedAssets.filter((asset) => asset.status === "COMPLETE")
        .length,
      training: trainedAssets.filter((asset) => asset.status === "TRAINING")
        .length,
      pending: trainedAssets.filter((asset) => asset.status === "PENDING")
        .length,
      failed: trainedAssets.filter((asset) => asset.status === "FAILED").length,
    });
  }, [trainedAssets, TRAINED_ASSETS]);

  const exampleStory = `SCENE 1 지포맨과 지포맨이 네온 빛이 가득한 사이버펑크 도시의 뒷골목으로 들어서다. 비가 내리고 바닥은 정어있다.

---

SCENE 2 지포맨이 컴퓨터 앞에 앉아 해킹을 시도한다. 복잡한 코드가 스크린에 흘러가며, 그의 눈이 집중하고 있다.

---

SCENE 3 지포맨이 옥상에서 하늘을 바라보며 생각에 잠겨있다. 네온사인의 빛이 그의 얼굴을 비춘다.`;

  // 스토리에서 씬 분리하는 함수
  const parseScenes = useCallback((storyText) => {
    if (!storyText.trim()) return [];

    const sceneTexts = storyText
      .split("---")
      .map((s) => s.trim())
      .filter((s) => s);
    return sceneTexts.map((text, index) => ({
      id: index + 1,
      description: text,
      imageUrl: null,
      prompt: null,
      referencedAssets: [],
    }));
  }, []);

  // 씬 내용 변경 감지를 위한 해시 함수 (한국어 안전)
  const getSceneHash = useCallback((sceneDescription) => {
    // 한국어 텍스트를 안전하게 해시화
    const text = sceneDescription.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash).toString(36); // 36진수로 변환하여 짧은 문자열 생성
  }, []);

  // 에셋 감지 및 씬 처리 함수 (변경된 씬만 이미지 초기화)
  const processStoryAndAssets = useCallback(
    (storyText) => {
      console.log("🔍 [DEBUG] processStoryAndAssets 시작", {
        storyText: storyText.substring(0, 100) + "...",
        trainedAssetsCount: TRAINED_ASSETS.length,
        trainedAssets: TRAINED_ASSETS.map((asset) => ({
          name: asset.name,
          triggerWord: asset.triggerWord,
          status: asset.status,
        })),
      });

      if (!storyText.trim()) {
        setDetectedAssets([]);
        setScenes([]);
        return;
      }

      // 씬 파싱
      const parsedScenes = parseScenes(storyText);
      console.log("📝 [DEBUG] 파싱된 씬들:", parsedScenes);

      if (TRAINED_ASSETS.length === 0) {
        console.log("⚠️ [DEBUG] 학습된 에셋이 없음");
        setDetectedAssets([]);
        // 기존 씬과 비교하여 변경된 씬만 이미지 초기화
        setScenes((prevScenes) => {
          return parsedScenes.map((newScene, index) => {
            const prevScene = prevScenes[index];
            const newHash = getSceneHash(newScene.description);
            const prevHash = prevScene
              ? getSceneHash(prevScene.description)
              : null;

            // 씬 내용이 변경되었으면 이미지 초기화, 그렇지 않으면 기존 이미지 유지
            if (prevScene && newHash === prevHash) {
              console.log(`🔄 [DEBUG] 씬 ${index + 1} 내용 동일 - 이미지 유지`);
              return {
                ...newScene,
                imageUrl: prevScene.imageUrl,
                prompt: prevScene.prompt,
                referencedAssets: prevScene.referencedAssets,
              };
            } else {
              console.log(
                `🆕 [DEBUG] 씬 ${index + 1} 내용 변경 - 이미지 초기화`
              );
              return newScene;
            }
          });
        });
        return;
      }

      // 전체 스토리에서 에셋 감지
      const foundAssets = TRAINED_ASSETS.filter((asset) => {
        const isFound = storyText
          .toLowerCase()
          .includes(asset.name.toLowerCase());
        console.log(
          `🔎 [DEBUG] 에셋 감지 체크: "${asset.name}" - ${
            isFound ? "발견됨" : "없음"
          }`
        );
        return isFound;
      });

      console.log(
        "✅ [DEBUG] 감지된 에셋들:",
        foundAssets.map((asset) => ({
          name: asset.name,
          triggerWord: asset.triggerWord,
          id: asset.id,
        }))
      );

      setDetectedAssets(foundAssets);

      // 각 씬별로 에셋 참조 분석
      const scenesWithAssets = parsedScenes.map((scene, index) => {
        const sceneAssets = foundAssets.filter((asset) => {
          const isInScene = scene.description
            .toLowerCase()
            .includes(asset.name.toLowerCase());
          console.log(
            `🎬 [DEBUG] 씬 ${index + 1}에서 "${asset.name}" 체크: ${
              isInScene ? "참조됨" : "없음"
            }`
          );
          return isInScene;
        });

        console.log(
          `🎭 [DEBUG] 씬 ${index + 1} 최종 참조 에셋:`,
          sceneAssets.map((asset) => asset.name)
        );

        return {
          ...scene,
          referencedAssets: sceneAssets,
        };
      });

      console.log(
        "🎯 [DEBUG] 최종 씬 데이터:",
        scenesWithAssets.map((scene, index) => ({
          sceneIndex: index + 1,
          description: scene.description.substring(0, 50) + "...",
          referencedAssets: scene.referencedAssets.map((asset) => asset.name),
        }))
      );

      // 기존 씬과 비교하여 변경된 씬만 이미지 초기화
      setScenes((prevScenes) => {
        return scenesWithAssets.map((newScene, index) => {
          const prevScene = prevScenes[index];
          const newHash = getSceneHash(newScene.description);
          const prevHash = prevScene
            ? getSceneHash(prevScene.description)
            : null;

          // 씬 내용이 변경되었으면 이미지 초기화, 그렇지 않으면 기존 이미지 유지
          if (prevScene && newHash === prevHash) {
            console.log(`🔄 [DEBUG] 씬 ${index + 1} 내용 동일 - 이미지 유지`);
            return {
              ...newScene,
              imageUrl: prevScene.imageUrl,
              prompt: prevScene.prompt,
              referencedAssets: newScene.referencedAssets, // 에셋 참조는 새로 계산된 것 사용
            };
          } else {
            console.log(`🆕 [DEBUG] 씬 ${index + 1} 내용 변경 - 이미지 초기화`);
            return newScene;
          }
        });
      });
    },
    [parseScenes, TRAINED_ASSETS, getSceneHash]
  );

  // 디바운스된 스토리가 변경될 때마다 처리
  useEffect(() => {
    processStoryAndAssets(debouncedStory);
  }, [debouncedStory, processStoryAndAssets]);

  // 예제 불러오기
  const loadExample = () => {
    setStory(exampleStory);
  };

  // 이미지 생성 함수
  const generateImage = async (sceneIndex) => {
    try {
      setGeneratingScene(sceneIndex);
      const scene = scenes[sceneIndex];

      console.log("🎬 [DEBUG] 이미지 생성 시작:", {
        sceneIndex,
        sceneDescription: scene.description,
      });

      // 해당 씬에서 참조된 에셋 찾기
      let characterName = null;
      let triggerWord = null;
      let assetId = null;

      if (scene.referencedAssets && scene.referencedAssets.length > 0) {
        const firstAsset = scene.referencedAssets[0];
        characterName = firstAsset.name;
        triggerWord = firstAsset.triggerWord;
        assetId = firstAsset.userLoraId || firstAsset.id;

        console.log("✅ [DEBUG] 참조된 에셋 발견:", {
          characterName,
          triggerWord,
          assetId,
          asset: firstAsset,
        });
      } else {
        console.log("❌ [DEBUG] 참조된 에셋이 없음");
      }

      console.log("📡 [DEBUG] Leonardo API 호출 파라미터:", {
        sceneDescription: scene.description,
        characterName,
        triggerWord,
        assetId,
      });

      // 사용자에게 진행 상황 알림
      toast.info("이미지 생성을 시작합니다... (최대 3분 소요)", {
        duration: 3000,
      });

      const response = await leonardoApi.generateImage(
        scene.description,
        characterName,
        triggerWord,
        assetId
      );

      console.log("📤 [DEBUG] Leonardo API 응답:", response);

      if (response.success && response.imageUrl) {
        setScenes((prevScenes) =>
          prevScenes.map((s, idx) =>
            idx === sceneIndex
              ? { ...s, imageUrl: response.imageUrl, prompt: response.prompt }
              : s
          )
        );
        toast.success("이미지가 성공적으로 생성되었습니다! 🎨");
        console.log("✅ [DEBUG] 이미지 생성 성공:", {
          imageUrl: response.imageUrl,
          prompt: response.prompt,
        });
      } else {
        throw new Error(response.error || "이미지 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ [DEBUG] Image generation error:", error);

      let errorMessage = "이미지 생성에 실패했습니다.";

      if (error.message.includes("timeout")) {
        errorMessage =
          "이미지 생성 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage =
          "서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setGeneratingScene(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 스토리 입력 섹션 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <CardTitle Icon={BookText} title="스토리 작성" />
          <button
            onClick={loadExample}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            예제 불러오기
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          '---'를 사용해서 장면(Scene)을 구분해주세요. 각 장면은 하나의 이미지로
          생성됩니다. 학습된 에셋의 이름을 포함하면 자동으로 해당 에셋이
          참조됩니다.
        </p>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="여기에 당신의 이야기를 작성하세요..."
          className="w-full h-64 p-3 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 leading-relaxed resize-none"
        />

        {/* 감지된 에셋 표시 */}
        {detectedAssets.length > 0 && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
            <h4 className="text-sm font-semibold text-green-300 mb-2">
              감지된 학습 에셋 ({detectedAssets.length}개)
            </h4>
            <div className="flex flex-wrap gap-2">
              {detectedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-gray-700 p-2 rounded-md flex items-center gap-2 text-xs"
                >
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="w-6 h-6 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-600 rounded-sm flex items-center justify-center">
                      <span className="text-yellow-400">★</span>
                    </div>
                  )}
                  <span className="text-gray-200 font-medium">
                    {asset.name}
                  </span>
                  <span className="text-gray-400">({asset.triggerWord})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 스토리보드 뷰어 섹션 */}
      {scenes.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <CardTitle Icon={Clapperboard} title="스토리보드" />
            <div className="text-sm text-gray-400">총 {scenes.length}개 씬</div>
          </div>

          <div className="space-y-8">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className="border border-gray-700 rounded-lg p-4 bg-gray-800/50"
              >
                <div className="flex gap-6">
                  <div className="w-2/5 flex-shrink-0">
                    <div className="bg-gray-900 p-4 rounded-lg h-full">
                      <h3 className="font-bold text-lg text-indigo-300 mb-3">
                        SCENE {index + 1}
                      </h3>
                      <p className="text-gray-300 text-sm leading-6 mb-4">
                        {scene.description}
                      </p>

                      {/* 참조된 에셋 표시 */}
                      {scene.referencedAssets &&
                        scene.referencedAssets.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-400 mb-2">
                              참조된 에셋 ({scene.referencedAssets.length}개)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {scene.referencedAssets.map((asset) => (
                                <div
                                  key={asset.id}
                                  className="bg-gray-700 p-1.5 rounded-md flex items-center gap-2 text-xs"
                                >
                                  {asset.imageUrl ? (
                                    <img
                                      src={asset.imageUrl}
                                      alt={asset.name}
                                      className="w-6 h-6 rounded-sm object-cover"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-gray-600 rounded-sm flex items-center justify-center">
                                      <span className="text-yellow-400">★</span>
                                    </div>
                                  )}
                                  <span className="text-gray-200 font-medium">
                                    {asset.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <Button
                        onClick={() => generateImage(index)}
                        className="w-full mt-4"
                        disabled={generatingScene !== null}
                      >
                        {generatingScene === index ? (
                          <>생성 중...</>
                        ) : (
                          <>이미지 생성</>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="w-3/5">
                    <div className="aspect-w-9 aspect-h-16 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700 min-h-[300px]">
                      {generatingScene === index && !scene.imageUrl ? (
                        <div className="text-center text-gray-400 flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                          <span className="text-lg">
                            AI가 이미지를 생성하고 있습니다...
                          </span>
                        </div>
                      ) : scene.imageUrl ? (
                        <img
                          src={scene.imageUrl}
                          alt={`Scene ${index + 1}`}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://placehold.co/576x1024/1f2937/9ca3af?text=Error+Loading+Image`;
                          }}
                        />
                      ) : (
                        <div className="text-center text-gray-500 flex flex-col items-center justify-center">
                          <Clapperboard className="w-12 h-12 text-gray-600 mb-4" />
                          <span className="text-lg">
                            이미지 생성 버튼을 클릭하세요
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StoryManager;
