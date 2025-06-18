import React from "react";

const CardTitle = ({ Icon, title }) => (
  <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-3">
    <Icon className="w-6 h-6 text-indigo-400" />
    <span>{title}</span>
  </h2>
);

export default CardTitle;
