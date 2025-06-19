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
    Object: "오브젝트",
    Style: "스타일",
  };

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

  return (
    <Card>
      {!simple && (
        <>
          <CardTitle title="학습된 에셋" />
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
              className={`relative bg-gray-700 rounded-lg overflow-hidden shadow-lg transform transition-all duration-200 ${
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
                  />
                ) : (
                  <span className="text-gray-400">이미지 없음</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-100 truncate">
                  {asset.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  트리거: {asset.triggerWord}
                </p>
                <p className="text-sm text-gray-400">
                  카테고리: {asset.category}
                </p>
                <p className="text-sm text-gray-500">상태: {asset.status}</p>
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
