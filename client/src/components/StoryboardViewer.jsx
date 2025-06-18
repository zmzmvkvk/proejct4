import React from "react";
import { Clapperboard, Loader, Sparkles, Image } from "./Icons";
import Button from "./Button";
import Card from "./Card";
import CardTitle from "./CardTitle";

const StoryboardViewer = ({ scenes, onGenerate, generatingScene }) => {
  return (
    <Card className="flex-grow">
      <CardTitle Icon={Clapperboard} title="스토리보드" />
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
                  <p className="text-gray-300 text-sm leading-6">
                    {scene.description}
                  </p>
                </div>
                <Button
                  onClick={() => onGenerate(index)}
                  className="w-full mt-4"
                  disabled={generatingScene !== null}
                >
                  {generatingScene === index ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" /> 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> 이미지 생성
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="w-3/5">
              <div className="aspect-w-9 aspect-h-16 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700 max-h-[400px]">
                {generatingScene === index && !scene.imageUrl ? (
                  <div className="text-center text-gray-400 h-[400px] flex flex-col items-center justify-center">
                    <Loader className="w-12 h-12 animate-spin mx-auto mb-2" />
                    <p>AI가 이미지를 생성하고 있습니다...</p>
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
                    <Image className="w-12 h-12 mx-auto mb-2" />
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

export default StoryboardViewer;
