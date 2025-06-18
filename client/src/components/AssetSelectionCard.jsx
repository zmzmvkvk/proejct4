import React from "react";
import Card from "./Card";
import { icons } from "./Icons"; // Corrected import path for icons

const AssetSelectionCard = ({ asset, selectedAssetId, onSelect }) => {
  const isSelected = selectedAssetId === asset.id;

  const renderIcon = (assetType) => {
    switch (assetType) {
      case "CHARACTER":
        return <icons.User className="w-10 h-10 text-gray-400" />;
      case "OBJECT":
        return <icons.Image className="w-10 h-10 text-gray-400" />;
      case "BACKGROUND":
        return <icons.Clapperboard className="w-10 h-10 text-gray-400" />;
      default:
        return <icons.Sparkles className="w-10 h-10 text-gray-400" />;
    }
  };

  return (
    <Card
      className={`cursor-pointer hover:border-indigo-500 transition-all duration-200 ${
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-500"
          : "border-gray-700"
      }`}
      onClick={() => onSelect(asset.id)}
    >
      <div className="flex flex-col items-center justify-center h-full">
        {asset.type !== "none" && asset.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="w-24 h-24 object-cover rounded-md mb-2"
          />
        ) : (
          <div className="w-24 h-24 flex items-center justify-center bg-gray-700 rounded-md mb-2">
            {renderIcon(asset.type)}
          </div>
        )}
        <span className="text-center font-semibold text-gray-200">
          {asset.name}
        </span>
        {asset.type === "none" && (
          <p className="text-sm text-gray-400 mt-1">선택 안함</p>
        )}
      </div>
    </Card>
  );
};

export default AssetSelectionCard;
