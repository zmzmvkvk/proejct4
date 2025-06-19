import React from "react";
import Card from "./Card";

const CharacterReferenceCard = ({ detectedCharacter, characterData }) => {
  if (!detectedCharacter || !characterData) return null;

  return (
    <Card className="bg-green-900/20 border-green-500/50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
            {characterData.imageUrl ? (
              <img
                src={characterData.imageUrl}
                alt={detectedCharacter}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-400">이미지 없음</span>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-green-300">
              캐릭터 감지됨: {detectedCharacter}
            </h4>
            <p className="text-sm text-gray-400">
              트리거: {characterData.triggerWord || "N/A"}
            </p>
            <p className="text-sm text-gray-400">
              카테고리: {characterData.category || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CharacterReferenceCard;
