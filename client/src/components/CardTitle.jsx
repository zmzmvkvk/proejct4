import React from "react";

const CardTitle = ({ title }) => (
  <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-3">
    <span>{title}</span>
  </h2>
);

export default CardTitle;
