import React from "react";

const statusConfig = {
  PRIMITA: {
    label: "PRIMITĂ",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  },
  VERIFICATA: {
    label: "VERIFICATĂ",
    className: "bg-orange-100 text-orange-700 border border-orange-200",
  },
  TRIMISA: {
    label: "TRIMISĂ",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800 border border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}