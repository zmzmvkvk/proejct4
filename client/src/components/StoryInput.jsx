import React from "react";
import { BookText } from "./Icons";
import Card from "./Card";
import CardTitle from "./CardTitle";

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
    </Card>
  );
};

export default StoryInput;
