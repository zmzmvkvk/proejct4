import React, { useState, useEffect } from "react";
import { BookText } from "./Icons";
import Card from "./Card";
import CardTitle from "./CardTitle";
import CharacterReferenceCard from "./CharacterReferenceCard";
import useDebounce from "../hooks/useDebounce";

const StoryInput = ({
  story,
  setStory,
  trainedAssets = [],
  onCharacterDetected,
}) => {
  const [detectedCharacter, setDetectedCharacter] = useState(null);
  const [characterData, setCharacterData] = useState(null);

  // 디바운스된 스토리 텍스트 (300ms 지연)
  const debouncedStory = useDebounce(story, 300);

  // 사전 훈련된 캐릭터 목록 (실제 데이터에서 추출)
  const TRAINED_CHARACTERS = trainedAssets
    .filter(
      (asset) => asset.category === "Character" && asset.status === "COMPLETE"
    )
    .map((asset) => asset.name);

  const exampleStory = `SCENE 1
주인공 엘라라가 네온 불빛이 가득한 사이버펑크 도시의 뒷골목으로 들어선다. 비가 내리고 바닥은 젖어있다.

---

SCENE 2
엘라라는 거대한 감시 드론을 발견하고, 재빠르게 그림자 속으로 몸을 숨긴다. 긴장감이 흐른다.

---

SCENE 3
드론이 지나간 후, 엘라라는 비밀스러운 문에 다가가 홀로그램 잠금장치를 해제하려고 시도한다.`;

  const loadExample = () => {
    setStory(exampleStory);
  };

  // 실시간 캐릭터 감지 함수
  const detectCharacter = (text) => {
    if (!text || TRAINED_CHARACTERS.length === 0) {
      setDetectedCharacter(null);
      setCharacterData(null);
      if (onCharacterDetected) {
        onCharacterDetected(null, null);
      }
      return;
    }

    // 텍스트에서 훈련된 캐릭터 이름 찾기
    const foundCharacter = TRAINED_CHARACTERS.find((characterName) =>
      text.includes(characterName)
    );

    if (foundCharacter) {
      setDetectedCharacter(foundCharacter);
      // 해당 캐릭터의 데이터 찾기
      const foundCharacterData = trainedAssets.find(
        (asset) => asset.name === foundCharacter
      );
      setCharacterData(foundCharacterData || null);

      // 부모 컴포넌트에 감지된 캐릭터 정보 전달
      if (onCharacterDetected) {
        onCharacterDetected(foundCharacter, foundCharacterData || null);
      }
    } else {
      setDetectedCharacter(null);
      setCharacterData(null);
      if (onCharacterDetected) {
        onCharacterDetected(null, null);
      }
    }
  };

  // 디바운스된 스토리가 변경될 때마다 캐릭터 감지
  useEffect(() => {
    detectCharacter(debouncedStory);
  }, [debouncedStory, TRAINED_CHARACTERS, trainedAssets, onCharacterDetected]);

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <CardTitle Icon={BookText} title="스토리 작성" />
        <button
          onClick={loadExample}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          예제 불러오기
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        '---'를 사용해서 장면(Scene)을 구분해주세요. 각 장면은 하나의 이미지로
        생성됩니다.
      </p>
      <textarea
        value={story}
        onChange={(e) => setStory(e.target.value)}
        placeholder="여기에 당신의 이야기를 작성하세요..."
        className="w-full h-96 p-3 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 leading-relaxed"
      />

      {/* 캐릭터 감지 카드 */}
      <CharacterReferenceCard
        detectedCharacter={detectedCharacter}
        characterData={characterData}
      />
    </Card>
  );
};

export default StoryInput;
