import React, { useState } from "react";
import { User, Trash2, PlusCircle } from "./Icons";
import Card from "./Card";
import CardTitle from "./CardTitle";
import Input from "./Input";
import Button from "./Button";

const CharacterManager = ({ characters, setCharacters }) => {
  const [filterCategory, setFilterCategory] = useState("all");
  const [newCharName, setNewCharName] = useState("");
  const [newCharRef, setNewCharRef] = useState("");

  const deleteCharacter = (id) => {
    setCharacters(characters.filter((c) => c.id !== id));
  };

  const addCharacter = () => {
    // Implementation of adding a new character
  };

  const filteredCharacters = characters.filter((char) => {
    if (filterCategory === "all") return true;
    return char.category === filterCategory;
  });

  return (
    <Card>
      <CardTitle Icon={User} title="캐릭터 관리" />
      <div className="flex justify-around mb-4 space-x-2">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
            filterCategory === "all"
              ? "bg-indigo-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilterCategory("character")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
            filterCategory === "character"
              ? "bg-indigo-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          캐릭터
        </button>
        <button
          onClick={() => setFilterCategory("object")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
            filterCategory === "object"
              ? "bg-indigo-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          오브젝트
        </button>
        <button
          onClick={() => setFilterCategory("background")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
            filterCategory === "background"
              ? "bg-indigo-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          배경
        </button>
      </div>
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
        {filteredCharacters.length === 0 ? (
          <p className="text-gray-400 text-center">학습된 에셋이 없습니다.</p>
        ) : (
          filteredCharacters.map((char) => (
            <div
              key={char.id}
              className="bg-gray-700 p-3 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {char.referenceImage ? (
                  <img
                    src={char.referenceImage}
                    alt={char.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-200 block">
                    {char.name}
                  </span>
                  <span className="text-gray-400 text-sm">
                    [{char.category}]
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteCharacter(char.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
      <div className="mt-6 space-y-3">
        <Input
          value={newCharName}
          onChange={(e) => setNewCharName(e.target.value)}
          placeholder="새 캐릭터 이름"
        />
        <Input
          value={newCharRef}
          onChange={(e) => setNewCharRef(e.target.value)}
          placeholder="참조 이미지 URL (필수)"
        />
        <Button onClick={addCharacter} className="w-full">
          <PlusCircle className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
};

export default CharacterManager;
