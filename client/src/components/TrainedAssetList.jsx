import React, { useState } from "react";
import Card from "./Card";
import CardTitle from "./CardTitle";
import { Sparkles, Loader } from "./Icons";
import Button from "./Button";
import { Heart, Star, Filter } from "lucide-react";

const TrainedAssetList = ({
  assets = [],
  onToggleFavorite,
  simple = false,
}) => {
  const [activeAssetId, setActiveAssetId] = useState(null);
  const [filter, setFilter] = useState("all");

  const filteredAssets = simple
    ? assets
    : assets.filter((asset) => {
        switch (filter) {
          case "character":
            return asset.type === "character";
          case "background":
            return asset.type === "background";
          case "object":
            return asset.type === "object";
          case "favorite":
            return asset.isFavorite;
          default:
            return true;
        }
      });

  if (simple) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAssets.length === 0 ? (
          <p className="text-center text-gray-400 py-8 w-full col-span-full">
            즐겨찾기된 에셋이 없습니다.
          </p>
        ) : (
          filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() =>
                setActiveAssetId(asset.id === activeAssetId ? null : asset.id)
              }
              className={`relative bg-gray-700 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-all duration-200
                ${asset.status === "PENDING" ? "opacity-60 grayscale" : ""}
                ${
                  asset.id === activeAssetId
                    ? "ring-4 ring-indigo-500 scale-105"
                    : "hover:scale-105 hover:shadow-xl"
                }`}
            >
              {asset.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-gray-600 flex items-center justify-center text-gray-400 text-sm">
                  {asset.status === "PENDING" ? (
                    <div className="flex flex-col items-center">
                      <Loader className="w-8 h-8 animate-spin" />
                      <span>학습 중...</span>
                    </div>
                  ) : (
                    "이미지 없음"
                  )}
                </div>
              )}
              <div className="p-3">
                <h3 className="text-md font-semibold text-gray-100 truncate">
                  {asset.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  트리거: {asset.triggerWord}
                </p>
                <p className="text-xs text-gray-500">상태: {asset.status}</p>
                <div className="flex justify-end items-center mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(asset.id);
                    }}
                    className={`p-1 rounded-full text-gray-400 hover:text-yellow-400
                      ${asset.isFavorite ? "text-yellow-400" : ""}`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        asset.isFavorite ? "fill-yellow-400" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardTitle Icon={Sparkles} title="학습된 에셋" />
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter("character")}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
            filter === "character"
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          캐릭터
        </button>
        <button
          onClick={() => setFilter("background")}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
            filter === "background"
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          배경
        </button>
        <button
          onClick={() => setFilter("object")}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
            filter === "object"
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          오브젝트
        </button>
        <button
          onClick={() => setFilter("favorite")}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
            filter === "favorite"
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          즐겨찾기
        </button>
      </div>

      {filteredAssets.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          표시할 학습된 에셋이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() =>
                setActiveAssetId(asset.id === activeAssetId ? null : asset.id)
              }
              className={`relative bg-gray-700 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-all duration-200
                ${asset.status === "PENDING" ? "opacity-60 grayscale" : ""}
                ${
                  asset.id === activeAssetId
                    ? "ring-4 ring-indigo-500 scale-105"
                    : "hover:scale-105 hover:shadow-xl"
                }`}
            >
              {asset.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-gray-600 flex items-center justify-center text-gray-400 text-sm">
                  {asset.status === "PENDING" ? (
                    <div className="flex flex-col items-center">
                      <Loader className="w-8 h-8 animate-spin" />
                      <span>학습 중...</span>
                    </div>
                  ) : (
                    "이미지 없음"
                  )}
                </div>
              )}
              <div className="p-3">
                <h3 className="text-md font-semibold text-gray-100 truncate">
                  {asset.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  트리거: {asset.triggerWord}
                </p>
                <p className="text-xs text-gray-500">상태: {asset.status}</p>
                <div className="flex justify-end items-center mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(asset.id);
                    }}
                    className={`p-1 rounded-full text-gray-400 hover:text-yellow-400
                      ${asset.isFavorite ? "text-yellow-400" : ""}`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        asset.isFavorite ? "fill-yellow-400" : ""
                      }`}
                    />
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
