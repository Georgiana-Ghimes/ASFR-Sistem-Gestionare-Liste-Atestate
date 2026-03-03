import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import StatsCard from "../components/StatsCard";
import { List, Clock, CheckCircle, Send, Calendar } from "lucide-react";
import { format, getMonth, getYear } from "date-fns";

export default function Dashboard({ user }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterISF, setFilterISF] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.getAllLists();
        setLists(data);
      } catch (error) {
        console.error('Failed to load lists:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // No restrictions - all authenticated users can see dashboard

  const allISFs = [...new Set(lists.map((l) => l.isf_name).filter(Boolean))].sort();
  const years = [...new Set(lists.map((l) => l.data_lista ? String(new Date(l.data_lista).getFullYear()) : null).filter(Boolean))].sort((a, b) => parseInt(b) - parseInt(a));
  if (!years.includes(filterYear)) years.unshift(filterYear);

  const nowMonth = parseInt(filterMonth);
  const nowYear = parseInt(filterYear);

  const filteredByStat = lists.filter((l) => {
    if (filterISF && l.isf_name !== filterISF) return false;
    return true;
  });

  const filteredByPeriod = lists.filter((l) => {
    if (filterISF && l.isf_name !== filterISF) return false;
    // Filter by trimis_at date instead of data_lista
    if (l.trimis_at) {
      const d = new Date(l.trimis_at);
      if (getMonth(d) + 1 !== nowMonth) return false;
      if (getYear(d) !== nowYear) return false;
    } else return false;
    return true;
  });

  const kpi = {
    total: filteredByStat.length,
    primita: filteredByStat.filter((l) => l.status === "PRIMITA").length,
    verificata: filteredByStat.filter((l) => l.status === "VERIFICATA").length,
    trimisa: filteredByStat.filter((l) => l.status === "TRIMISA").length,
    trimisaLuna: filteredByPeriod.filter((l) => l.status === "TRIMISA").length,
  };

  const isfStats = allISFs
    .filter((isf) => !filterISF || isf === filterISF)
    .map((isf) => {
      const isfLists = filteredByStat.filter((l) => l.isf_name === isf);
      const isfListsLuna = filteredByPeriod.filter((l) => l.isf_name === isf);
      return {
        isf_name: isf,
        total: isfLists.length,
        primita: isfLists.filter((l) => l.status === "PRIMITA").length,
        verificata: isfLists.filter((l) => l.status === "VERIFICATA").length,
        trimisa: isfLists.filter((l) => l.status === "TRIMISA").length,
        trimisaLuna: isfListsLuna.filter((l) => l.status === "TRIMISA").length,
      };
    });

  const months = [
    { v: "01", l: "Ianuarie" }, { v: "02", l: "Februarie" }, { v: "03", l: "Martie" },
    { v: "04", l: "Aprilie" }, { v: "05", l: "Mai" }, { v: "06", l: "Iunie" },
    { v: "07", l: "Iulie" }, { v: "08", l: "August" }, { v: "09", l: "Septembrie" },
    { v: "10", l: "Octombrie" }, { v: "11", l: "Noiembrie" }, { v: "12", l: "Decembrie" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Statistici generale privind listele de tipărire autorizații.</p>
      </div>

      {/* Period filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Lună</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m) => (
                <option key={m.v} value={m.v}>{m.l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">An</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">ISF</label>
            <select
              value={filterISF}
              onChange={(e) => setFilterISF(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toate ISF-urile</option>
              {allISFs.map((isf) => (
                <option key={isf} value={isf}>{isf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatsCard title="Total Liste" value={kpi.total} icon={List} color="slate" />
            <StatsCard title="PRIMITE" value={kpi.primita} icon={Clock} color="amber" />
            <StatsCard title="VERIFICATE" value={kpi.verificata} icon={CheckCircle} color="blue" />
            <StatsCard title="TRIMISE" value={kpi.trimisa} icon={Send} color="emerald" />
            <StatsCard title={`Trimise ${months.find(m => m.v === filterMonth)?.l} ${filterYear}`} value={kpi.trimisaLuna} icon={Calendar} color="violet" />
          </div>

          {/* ISF Stats Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Statistici per ISF</h2>
              <p className="text-xs text-gray-400 mt-0.5">Totaluri generale (fără filtru de perioadă), coloana "Trimise lună" respectă perioada selectată.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["ISF", "Total Liste", "PRIMITE", "VERIFICATE", "TRIMISE", `Trimise ${months.find(m => m.v === filterMonth)?.l}`].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isfStats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                        Nu există date disponibile.
                      </td>
                    </tr>
                  ) : (
                    isfStats.map((row) => (
                      <tr key={row.isf_name} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{row.isf_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{row.total}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            {row.primita}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {row.verificata}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {row.trimisa}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800">
                            {row.trimisaLuna}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}