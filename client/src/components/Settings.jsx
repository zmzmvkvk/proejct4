import React from "react";
import Input from "./Input";
import Button from "./Button";

const Settings = ({ apiKey, setApiKey, isVisible, onClose }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          API 설정
        </h2>
        <p className="text-gray-400 mb-4">
          이미지 생성을 위해 Leonardo.ai API 키가 필요합니다.
        </p>
        <Input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Leonardo.ai API 키를 입력하세요"
          type="password"
        />
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
