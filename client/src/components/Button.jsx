import React from "react";

const Button = ({ children, onClick, className = "", disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${className} ${
      disabled
        ? "bg-gray-500 cursor-not-allowed"
        : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
    }`}
  >
    {children}
  </button>
);

export default Button;
