import React, { useState } from "react";
import Card from "./Card";
import CardTitle from "./CardTitle";
import Input from "./Input";
import Button from "./Button";

// GPT-4o로 description 생성 함수
async function getDescriptionWithGPT(assetName, category) {
  const prompt = `Write a single, concise English sentence describing a LoRA asset for animation. Include the asset name (${assetName}), category (${category}), and mention that it is in animation style. Example: "A Character LoRA for Elara in animation style."`;
  const res = await fetch("http://localhost:3000/api/openai/gpt-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  return data.description;
}

const ImageTrainingForm = ({ onAssetCreated }) => {
  const [assetName, setAssetName] = useState("");
  const [triggerWord, setTriggerWord] = useState("");
  const [category, setCategory] = useState("General"); // Leonardo.ai lora_focus 기본값을 General로 설정
  const [referenceImages, setReferenceImages] = useState([]); // 파일 객체 배열
  const [isTraining, setIsTraining] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileChange = (e) => {
    setReferenceImages(Array.from(e.target.files));
  };

  const startTraining = async () => {
    if (
      !assetName.trim() ||
      !triggerWord.trim() ||
      referenceImages.length === 0
    ) {
      setErrorMessage("모든 필드를 채우고 참조 이미지를 업로드해주세요.");
      return;
    }
    setIsTraining(true);
    setErrorMessage(null);

    try {
      // 1. 데이터셋 생성
      const datasetResponse = await fetch(
        "http://localhost:3000/api/leonardo/create-dataset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: assetName,
            description: `Dataset for ${assetName} LoRA training`,
          }),
        }
      );
      if (!datasetResponse.ok)
        throw new Error(
          `Dataset creation failed: ${datasetResponse.statusText}`
        );
      const datasetData = await datasetResponse.json();
      const datasetId = datasetData.insert_datasets_one.id;
      console.log("Dataset created with ID:", datasetId);

      // 2. 참조 이미지 업로드
      const uploadedImageIds = [];
      for (const file of referenceImages) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch(
          `http://localhost:3000/api/leonardo/upload-training-image/${datasetId}`,
          {
            method: "POST",
            body: formData,
          }
        );
        if (!uploadResponse.ok)
          throw new Error(
            `Image upload failed for ${file.name}: ${uploadResponse.statusText}`
          );
        const uploadData = await uploadResponse.json();
        uploadedImageIds.push(uploadData.imageId);
        console.log(`Uploaded image ${file.name} with ID:`, uploadData.imageId);
      }

      // 3. GPT-4o로 description 생성
      const description = await getDescriptionWithGPT(assetName, category);

      // 4. Leonardo.ai API 문서에 맞는 정확한 파라미터로 학습 요청
      const trainResponse = await fetch(
        "http://localhost:3000/api/leonardo/train-element",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: assetName,
            description,
            datasetId: datasetId,
            instance_prompt: triggerWord,
            lora_focus: category, // General, Character, Object, Style, Product, Face 중 하나
            train_text_encoder: true, // 애니메이션 스타일에 중요
            resolution: 1024,
            sd_version: "SDXL_1_0", // Leonardo Anime XL과 최고 호환성
            num_train_epochs:
              category === "Character" ? 120 : category === "Style" ? 150 : 100, // 애니메이션 캐릭터/스타일에 최적화
            learning_rate:
              category === "Character"
                ? 0.0000008
                : category === "Style"
                ? 0.0000005
                : 0.000001, // 애니메이션에 맞춘 학습률
          }),
        }
      );
      if (!trainResponse.ok)
        throw new Error(`Element training failed: ${trainResponse.statusText}`);
      const trainData = await trainResponse.json();
      const userLoraId = trainData.sdTrainingJob.userLoraId;
      console.log("Training job started with userLoraId:", userLoraId);

      // 5. 학습이 시작되었음을 사용자에게 알림
      console.log(
        "Training job started successfully with userLoraId:",
        userLoraId
      );

      // 부모 컴포넌트에 새 에셋이 추가되었음을 알림 (학습 중 상태로)
      if (onAssetCreated) {
        onAssetCreated();
      }

      // 성공 메시지 표시
      alert(
        `🎉 "${assetName}" 에셋 학습이 시작되었습니다!\n\n학습은 백그라운드에서 진행되며, 완료되면 에셋 목록에 표시됩니다.\n(보통 5-15분 정도 소요됩니다)`
      );

      // 폼 초기화
      setAssetName("");
      setTriggerWord("");
      setCategory("General");
      setReferenceImages([]);
    } catch (error) {
      console.error("학습 시작 중 오류 발생:", error);
      setErrorMessage(`학습 시작 중 오류 발생: ${error.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <Card>
      <CardTitle title="새로운 에셋 학습" />
      <p className="text-sm text-gray-400 mb-4">
        캐릭터, 오브젝트, 배경 등 고유한 스타일을 가진 에셋을 학습시켜 이미지
        생성에 활용하세요.
      </p>

      <div className="space-y-4 mb-6">
        <Input
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          placeholder="에셋 이름 (예: 엘라라)"
        />
        <Input
          value={triggerWord}
          onChange={(e) => setTriggerWord(e.target.value)}
          placeholder="트리거 워드 (예: elara_character)"
        />
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            LoRA 카테고리 (학습 최적화 방식)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200"
          >
            <option value="General">General (일반)</option>
            <option value="Character">Character (캐릭터)</option>
            <option value="Object">Object (오브젝트)</option>
            <option value="Style">Style (스타일)</option>
            <option value="Product">Product (제품)</option>
            <option value="Face">Face (얼굴)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            카테고리에 따라 Leonardo.ai가 최적화된 학습 방식을 사용합니다.
          </p>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            참조 이미지 업로드 (최소 8~10장 권장)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-gray-300 bg-gray-700 border border-gray-600 rounded-md p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
          />
          {referenceImages.length > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              선택된 파일: {referenceImages.map((file) => file.name).join(", ")}
            </p>
          )}
        </div>
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-4">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}
        <Button
          onClick={startTraining}
          className="w-full"
          disabled={isTraining}
        >
          {isTraining ? <>학습 중...</> : <>학습 시작</>}
        </Button>
      </div>
    </Card>
  );
};

export default ImageTrainingForm;
