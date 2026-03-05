import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import StatusBadge from "../components/StatusBadge";
import PDFViewerModal from "../components/PDFViewerModal";
import { Search, ChevronUp, ChevronDown, Filter, Eye } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";

export default function MyLists({ user }) {
  const location = useLocation();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");
  const [pdfModal, setPdfModal] = useState(null);
  const [highlightId, setHighlightId] = useState(null);

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
    
    // Poll for updates every 3 seconds
    const interval = setInterval(load, 3000);
    
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Handle highlight from navigation state
    if (location.state?.highlightId) {
      setHighlightId(location.state.highlightId);
      
      // Scroll to the row after a short delay
      setTimeout(() => {
        const row = document.getElementById(`list-row-${location.state.highlightId}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      // Remove highlight after animation (2 pulses × 1s each)
      setTimeout(() => {
        setHighlightId(null);
      }, 2000);
      
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = lists
    .filter((l) => {
      if (filterStatus !== "ALL" && l.status !== filterStatus) return false;
      if (filterFrom && l.created_date < filterFrom) return false;
      if (filterTo && l.created_date > filterTo) return false;
      if (search && !l.numar_lista.toLowerCase().startsWith(search.toLowerCase())) return false;
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
      {pdfModal && (
        <PDFViewerModal
          url={pdfModal.url}
          filename={pdfModal.filename}
          onClose={() => setPdfModal(null)}
        />
      )}

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
              placeholder="Caută număr comisie..."
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
                    { label: "Număr Comisie", col: "numar_lista" },
                    { label: "Tip", col: "tip" },
                    { label: "Nr. Aut./Exam.", col: "numar_autorizatii" },
                    { label: "Status", col: "status" },
                    { label: "Urcată de", col: "created_date" },
                    { label: "Verificată de", col: "verificat_at" },
                    { label: "Trimisă de", col: "trimis_at" },
                    { label: "Acțiuni", col: null },
                  ].map(({ label, col }) => (
                    <th
                      key={label}
                      onClick={() => col && handleSort(col)}
                      className={`px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase ${col ? "cursor-pointer hover:text-gray-700 select-none" : ""}`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {label}
                        {col && <SortIcon col={col} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">
                      Nu există liste care să corespundă filtrelor selectate.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr 
                      key={l.id} 
                      id={`list-row-${l.id}`}
                      className={`transition-colors ${
                        highlightId === l.id 
                          ? 'animate-pulse-green' 
                          : l.status === 'TRIMISA' 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-3 py-2 text-xs font-bold text-gray-900 text-center">{l.numar_lista}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 text-center">{l.tip || "-"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 text-center">{l.numar_autorizatii}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center">
                          <StatusBadge status={l.status} />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 text-center">
                        {l.created_date ? (
                          <>
                            <div>{format(new Date(l.created_date), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(l.created_date), "HH:mm")}</div>
                            {l.created_by_email && <div className="text-[10px]">({l.created_by_email})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 text-center">
                        {l.verificat_at ? (
                          <>
                            <div>{format(new Date(l.verificat_at), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(l.verificat_at), "HH:mm")}</div>
                            {l.verificat_by && <div className="text-[10px]">({l.verificat_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 text-center">
                        {l.trimis_at ? (
                          <>
                            <div>{format(new Date(l.trimis_at), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(l.trimis_at), "HH:mm")}</div>
                            {l.trimis_by && <div className="text-[10px]">({l.trimis_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {l.pdf_url && (
                          <button
                            onClick={() => setPdfModal({ url: l.pdf_url, filename: l.pdf_filename })}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Vizualizare PDF"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                        )}
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
