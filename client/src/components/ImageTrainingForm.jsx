import React, { useState } from "react";
import Card from "./Card";
import CardTitle from "./CardTitle";
import { Sparkles, Loader, PlusCircle } from "./Icons";
import Input from "./Input";
import Button from "./Button";

// GPT-4o로 description 생성 함수
async function getDescriptionWithGPT(assetName, category) {
  const prompt = `Write a single, concise English sentence describing a LoRA asset for animation. Include the asset name (${assetName}), category (${category}), and mention that it is in animation style. Example: "A Character LoRA for Elara in animation style."`;
  const res = await fetch("/api/gpt-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  return data.description;
}

const ImageTrainingForm = ({ fetchTrainedAssets, setErrorMessage }) => {
  const [assetName, setAssetName] = useState("");
  const [triggerWord, setTriggerWord] = useState("");
  const [category, setCategory] = useState("character"); // 'character', 'object', 'background'
  const [referenceImages, setReferenceImages] = useState([]); // 파일 객체 배열
  const [isTraining, setIsTraining] = useState(false);

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
      const datasetResponse = await fetch("/api/create-dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: assetName,
          description: `Dataset for ${assetName} LoRA`,
        }),
      });
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
          `/api/upload-training-image/${datasetId}`,
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

      // 3. GPT-4o로 description 한 번만 생성
      const description = await getDescriptionWithGPT(assetName, category);

      // 카테고리-모델 자동 매칭
      let sd_version = "FLUX_DEV";
      if (category === "Character") {
        sd_version = "SDXL_1_0";
      }

      // FLUX_DEV에서 Character 선택 시 에러 안내 및 중단
      if (category === "Character" && sd_version === "FLUX_DEV") {
        setErrorMessage(
          "FLUX_DEV 모델은 Character 카테고리를 지원하지 않습니다. 카테고리를 Object 또는 Style로 변경하세요."
        );
        setIsTraining(false);
        return;
      }

      // 디버깅용 콘솔 로그
      console.log("lora_focus:", category, "sd_version:", sd_version);

      // 4. 학습 요청
      const trainResponse = await fetch("/api/train-element", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: assetName,
          description,
          datasetId: datasetId,
          instance_prompt: triggerWord,
          model_type: "lora",
          sd_version,
          resolution: 1024,
          strength: "MEDIUM",
          lora_focus: category,
          train_text_encoder: true,
          num_train_epochs: 100,
          learning_rate: 0.000001,
        }),
      });
      if (!trainResponse.ok)
        throw new Error(`Element training failed: ${trainResponse.statusText}`);
      const trainData = await trainResponse.json();
      const userLoraId = trainData.sdTrainingJob.userLoraId;
      console.log("Training job started with userLoraId:", userLoraId);

      // 5. 학습 완료될 때까지 폴링 (간단화된 로직)
      let trainingComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 5초 * 60 = 5분 동안 폴링
      while (!trainingComplete && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5초 대기
        const statusResponse = await fetch("/api/list-elements"); // 전체 목록에서 찾거나, 단일 에셋 조회 API 사용
        if (!statusResponse.ok)
          throw new Error(
            `Failed to poll training status: ${statusResponse.statusText}`
          );
        const statusData = await statusResponse.json();
        const currentAsset = statusData.userElements.find(
          (element) => element.id === userLoraId
        );

        if (currentAsset && currentAsset.status === "COMPLETE") {
          trainingComplete = true;
          fetchTrainedAssets(); // 부모로부터 받은 함수 호출하여 에셋 목록 새로고침
          break;
        } else if (currentAsset && currentAsset.status === "FAILED") {
          throw new Error("Element training failed on Leonardo.ai side.");
        }
        attempts++;
      }

      if (!trainingComplete) {
        throw new Error("Element training timed out or failed to complete.");
      }

      setAssetName("");
      setTriggerWord("");
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
      <CardTitle Icon={Sparkles} title="새로운 에셋 학습" />
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
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200"
        >
          <option value="Character">캐릭터</option>
          <option value="Object">오브젝트</option>
          <option value="Style">스타일</option>
        </select>
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            참조 이미지 업로드 (최소 8~10장 권장)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full text-gray-300 bg-gray-700 border border-gray-600 rounded-md p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
          />
          {referenceImages.length > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              선택된 파일: {referenceImages.map((file) => file.name).join(", ")}
            </p>
          )}
        </div>
        <Button
          onClick={startTraining}
          className="w-full"
          disabled={isTraining}
        >
          {isTraining ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> 학습 중...
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" /> 학습 시작
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ImageTrainingForm;
