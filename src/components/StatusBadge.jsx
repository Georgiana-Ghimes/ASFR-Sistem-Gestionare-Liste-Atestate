import React from "react";

const statusConfig = {
  PRIMITA: {
    label: "PRIMITĂ",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  VERIFICATA: {
    label: "VERIFICATĂ",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  TRIMISA: {
    label: "TRIMISĂ",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
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