import React from "react";
import Button from "./Button";

const ErrorModal = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-red-500">
        <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-3">
          오류 발생
        </h2>
        <p className="text-gray-300 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="bg-red-600 hover:bg-red-700">
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
