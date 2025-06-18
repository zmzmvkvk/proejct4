import React from "react";

const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
  />
);

export default Input;
