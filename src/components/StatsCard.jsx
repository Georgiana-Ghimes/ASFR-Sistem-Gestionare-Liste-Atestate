import React from "react";

export default function StatsCard({ title, value, icon: Icon, color }) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
    emerald: "from-emerald-500 to-emerald-600",
    violet: "from-violet-500 to-violet-600",
    slate: "from-slate-500 to-slate-600",
  };

  const gradient = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}