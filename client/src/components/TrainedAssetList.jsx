import React, { useState } from "react";
import Card from "./Card";
import CardTitle from "./CardTitle";

const TrainedAssetList = ({
  assets = [],
  onToggleFavorite,
  simple = false,
}) => {
  const [activeAssetId, setActiveAssetId] = useState(null);
  const [filter, setFilter] = useState("all");

  const categoryMap = {
    General: "캐릭터", // 'General'을 '캐릭터'로 간주
    Character: "캐릭터", // 'Character'도 '캐릭터'로 매핑
    Object: "오브젝트",
    Style: "스타일",
  };

  const statusMap = {
    COMPLETE: "완료",
    TRAINING: "학습 중",
    PENDING: "대기 중",
    PROCESSING: "처리 중",
    FAILED: "실패",
  };

  // 학습 중인 에셋 확인
  const trainingAssets = assets.filter(
    (asset) =>
      asset.status === "TRAINING" ||
      asset.status === "PENDING" ||
      asset.status === "PROCESSING"
  );

  const filteredAssets = simple
    ? assets
    : assets.filter((asset) => {
        if (filter === "all") return true;
        if (filter === "favorite") return asset.isFavorite;
        // [FINAL FIX] 실제 카테고리 데이터('General')와 필터 버튼('캐릭터')을 매칭
        const mappedCategory = categoryMap[asset.category] || asset.category;
        return mappedCategory === filter;
      });

  const FilterButton = ({ name, label }) => (
    <button
      onClick={() => setFilter(name)}
      className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors duration-200 ${
        filter === name
          ? "bg-indigo-600 text-white"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
  );

  const getDisplayValue = (value, fallback = "설정되지 않음") => {
    return value && value.trim() ? value : fallback;
  };

  const getStatusDisplay = (status) => {
    return statusMap[status] || status || "알 수 없음";
  };

  const getCategoryDisplay = (category) => {
    return categoryMap[category] || category || "미분류";
  };

  return (
    <Card>
      {!simple && (
        <>
          <CardTitle title="학습된 에셋" />

          {/* 학습 중인 에셋 안내 메시지 */}
          {trainingAssets.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⚠️</span>
                <div>
                  <p className="text-yellow-400 text-sm font-medium">
                    {trainingAssets.length}개의 에셋이 학습 중입니다
                  </p>
                  <p className="text-yellow-300 text-xs mt-1">
                    학습 상태를 확인하려면 새로고침 버튼을 클릭하세요. (보통
                    5-15분 소요)
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-gray-700">
            <FilterButton name="all" label="전체" />
            <FilterButton name="캐릭터" label="캐릭터" />
            <FilterButton name="오브젝트" label="오브젝트" />
            <FilterButton name="스타일" label="스타일" />
            <FilterButton name="favorite" label="즐겨찾기" />
          </div>
        </>
      )}

      {filteredAssets.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          표시할 학습된 에셋이 없습니다.
        </p>
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 ${
            simple
              ? "sm:grid-cols-2 md:grid-cols-3"
              : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() =>
                setActiveAssetId(asset.id === activeAssetId ? null : asset.id)
              }
              className={`relative bg-gray-700 rounded-lg overflow-hidden shadow-lg transform transition-all duration-200 cursor-pointer ${
                asset.id === activeAssetId
                  ? "ring-2 ring-indigo-500"
                  : "hover:scale-105"
              }`}
            >
              <div
                className={`w-full ${
                  simple ? "h-32" : "h-48"
                } bg-gray-600 flex items-center justify-center`}
              >
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/400x300/374151/9CA3AF?text=No+Image`;
                    }}
                  />
                ) : (
                  <span className="text-gray-400">이미지 없음</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-100 truncate mb-2">
                  {getDisplayValue(asset.name, "이름 없음")}
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">
                    <span className="font-medium">트리거:</span>{" "}
                    <span className="text-indigo-300">
                      {getDisplayValue(asset.triggerWord, "없음")}
                    </span>
                  </p>
                  <p className="text-gray-400">
                    <span className="font-medium">카테고리:</span>{" "}
                    <span className="text-green-300">
                      {getCategoryDisplay(asset.category)}
                    </span>
                  </p>
                  <p className="text-gray-400">
                    <span className="font-medium">상태:</span>{" "}
                    <span
                      className={`font-medium ${
                        asset.status === "COMPLETE"
                          ? "text-green-400"
                          : asset.status === "TRAINING"
                          ? "text-yellow-400"
                          : asset.status === "FAILED"
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                    >
                      {getStatusDisplay(asset.status)}
                    </span>
                  </p>
                </div>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(asset.id);
                    }}
                    className={`p-1.5 rounded-full transition-colors ${
                      asset.isFavorite
                        ? "text-yellow-400 bg-black/50"
                        : "text-white bg-black/30 hover:text-yellow-300"
                    }`}
                  >
                    {asset.isFavorite ? "★" : "☆"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default TrainedAssetList;
