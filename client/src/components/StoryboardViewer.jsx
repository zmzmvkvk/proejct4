import React from "react";
import Button from "./Button";
import Card from "./Card";
import CardTitle from "./CardTitle";

const StoryboardViewer = ({
  scenes,
  onGenerate,
  generatingScene,
  detectedCharacter,
  characterData,
}) => {
  return (
    <Card className="flex-grow">
      <CardTitle title="스토리보드" />

      {/* 캐릭터 감지 정보 표시 */}
      {detectedCharacter && characterData && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
          <p className="text-sm text-green-300">
            <span className="font-semibold">감지된 캐릭터:</span>{" "}
            {detectedCharacter}
            <span className="text-gray-400 ml-2">
              (트리거: {characterData.triggerWord})
            </span>
          </p>
        </div>
      )}

      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
        {scenes.map((scene, index) => (
          <div
            key={index}
            className="flex gap-4 items-start border-b border-gray-700 pb-6 last:border-b-0"
          >
            <div className="w-2/5 flex-shrink-0">
              <div className="bg-gray-900 p-4 rounded-lg h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-indigo-300 mb-2">
                    SCENE {index + 1}
                  </h3>
                  <p className="text-gray-300 text-sm leading-6 mb-4">
                    {scene.description}
                  </p>
                  {/* 참조된 에셋 표시 영역 */}
                  {scene.referencedAssets &&
                    scene.referencedAssets.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">
                          참조된 에셋
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
                </div>
                <Button
                  onClick={() => onGenerate(index, detectedCharacter)}
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
              <div className="aspect-w-9 aspect-h-16 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700 max-h-[400px]">
                {generatingScene === index && !scene.imageUrl ? (
                  <div className="text-center text-gray-400 h-[400px] flex flex-col items-center justify-center">
                    <span className="text-lg">
                      AI가 이미지를 생성하고 있습니다...
                    </span>
                  </div>
                ) : scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={`Scene ${index + 1}`}
                    className="w-auto h-full max-h-[400px] object-contain rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/576x1024/1f2937/9ca3af?text=Error`;
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500 h-[400px] flex flex-col items-center justify-center">
                    <span className="text-lg">
                      생성된 이미지가 여기에 표시됩니다.
                    </span>
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

export default StoryboardViewer;
