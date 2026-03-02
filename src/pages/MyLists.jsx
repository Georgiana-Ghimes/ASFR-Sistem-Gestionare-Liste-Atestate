import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import StatusBadge from "../components/StatusBadge";
import { Search, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { format } from "date-fns";

export default function MyLists({ user }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const data = await apiClient.getMyLists();
        setLists(data);
      } catch (error) {
        console.error('Failed to load lists:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = lists
    .filter((l) => {
      if (filterStatus !== "ALL" && l.status !== filterStatus) return false;
      if (filterFrom && l.data_lista < filterFrom) return false;
      if (filterTo && l.data_lista > filterTo) return false;
      if (search && !l.numar_lista.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let av = a[sortCol] || "";
      let bv = b[sortCol] || "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Listele Mele</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {user?.isf_name && <span className="font-medium text-blue-600">{user.isf_name}</span>} — toate listele dvs. de tipărire.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filtre</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută număr listă..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Toate statusurile</option>
            <option value="PRIMITA">PRIMITĂ</option>
            <option value="VERIFICATA">VERIFICATĂ</option>
            <option value="TRIMISA">TRIMISĂ</option>
          </select>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    { label: "Număr Listă", col: "numar_lista" },
                    { label: "Data Listă", col: "data_lista" },
                    { label: "Nr. Autorizații", col: "numar_autorizatii" },
                    { label: "Status", col: "status" },
                    { label: "Creat La", col: "created_date" },
                  ].map(({ label, col }) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <SortIcon col={col} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                      Nu există liste care să corespundă filtrelor selectate.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{l.numar_lista}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {l.data_lista ? format(new Date(l.data_lista), "dd.MM.yyyy") : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{l.numar_autorizatii}</td>
                      <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {l.created_date ? format(new Date(l.created_date), "dd.MM.yyyy HH:mm") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-400">{filtered.length} înregistrări afișate</p>
          </div>
        )}
      </div>
    </div>
  );
}