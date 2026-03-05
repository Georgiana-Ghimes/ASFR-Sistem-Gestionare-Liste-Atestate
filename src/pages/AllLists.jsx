import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import StatusBadge from "../components/StatusBadge";
import PDFViewerModal from "../components/PDFViewerModal";
import { Search, ChevronUp, ChevronDown, Filter, Download, Eye, CheckCircle, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";

const COLUMNS = [
  { label: "Număr Listă", col: "numar_lista" },
  { label: "ISF", col: "isf_name" },
  { label: "Data", col: "data_lista" },
  { label: "Nr. Autorizații", col: "numar_autorizatii" },
  { label: "Status", col: "status" },
  { label: "Urcat La", col: "created_date" },
  { label: "Verificat La", col: "verificat_at" },
  { label: "Trimis La", col: "trimis_at" },
  { label: "Acțiuni", col: null },
];

export default function AllLists({ user }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterISF, setFilterISF] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");
  const [pdfModal, setPdfModal] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

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

  const allISFs = [...new Set(lists.map((l) => l.isf_name).filter(Boolean))].sort();

  const handleStatusChange = async (lista, newStatus) => {
    if (user?.role !== 'cisf' && user?.role !== 'admin') return;
    const validTransitions = { PRIMITA: "VERIFICATA", VERIFICATA: "TRIMISA" };
    if (validTransitions[lista.status] !== newStatus) return;
    if (lista.status === "TRIMISA") return;

    setUpdatingId(lista.id);
    try {
      await apiClient.updateListStatus(lista.id, newStatus);
      await load();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (lista) => {
    if (user?.role !== 'admin') return;
    
    if (!confirm(`Sigur doriți să ștergeți lista ${lista.numar_lista}?`)) return;
    
    setDeletingId(lista.id);
    try {
      await apiClient.deleteList(lista.id);
      await load();
    } catch (error) {
      console.error('Failed to delete list:', error);
      alert('Eroare la ștergerea listei');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (col) => {
    if (!col) return;
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = lists
    .filter((l) => {
      if (filterStatus !== "ALL" && l.status !== filterStatus) return false;
      if (filterISF && l.isf_name !== filterISF) return false;
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

  const handleExport = () => {
    const headers = [
      "Număr Listă", "ISF", "Data", "Nr. Autorizații", "Status",
      "Creat La", "Verificat La", "Trimis La", "Verificat By", "Trimis By"
    ];
    const rows = filtered.map((l) => [
      l.numar_lista || "",
      l.isf_name || "",
      l.data_lista || "",
      l.numar_autorizatii || "",
      l.status || "",
      l.created_date ? format(new Date(l.created_date), "dd.MM.yyyy HH:mm") : "",
      l.verificat_at ? format(new Date(l.verificat_at), "dd.MM.yyyy HH:mm") : "",
      l.trimis_at ? format(new Date(l.trimis_at), "dd.MM.yyyy HH:mm") : "",
      l.verificat_by || "",
      l.trimis_by || "",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liste-tiparire-export-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => {
    if (!col || sortCol !== col) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
  };

  const fmtDate = (dt) => dt ? format(new Date(dt), "dd.MM.yyyy HH:mm") : "-";

  if (user?.role !== 'cisf' && user?.role !== 'admin' && user?.role !== 'isf') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700 font-medium">Acces neautorizat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {pdfModal && (
        <PDFViewerModal
          url={pdfModal.url}
          filename={pdfModal.filename}
          onClose={() => setPdfModal(null)}
        />
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administrare Liste</h1>
          <p className="text-gray-500 mt-1 text-sm">Gestionarea completă a tuturor listelor de tipărire autorizații.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filtre</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Număr listă..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
                  {COLUMNS.map(({ label, col }) => (
                    <th
                      key={label}
                      onClick={() => handleSort(col)}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col ? "cursor-pointer hover:text-gray-700 select-none" : ""}`}
                    >
                      <div className="flex items-center gap-1">
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
                    <td colSpan={COLUMNS.length} className="px-6 py-16 text-center text-gray-400 text-sm">
                      Nu există liste care să corespundă filtrelor selectate.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{l.numar_lista}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{l.isf_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {l.data_lista ? format(new Date(l.data_lista), "dd.MM.yyyy") : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{l.numar_autorizatii}</td>
                      <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(l.created_date)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {l.verificat_at ? (
                          <>
                            {format(new Date(l.verificat_at), "dd.MM.yyyy HH:mm")}
                            {l.verificat_by && <div>({l.verificat_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {l.trimis_at ? (
                          <>
                            {format(new Date(l.trimis_at), "dd.MM.yyyy HH:mm")}
                            {l.trimis_by && <div>({l.trimis_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {l.pdf_url && (
                            <button
                              onClick={() => setPdfModal({ url: l.pdf_url, filename: l.pdf_filename })}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Vizualizare PDF"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                          {l.status === "PRIMITA" && (
                            <button
                              onClick={() => handleStatusChange(l, "VERIFICATA")}
                              disabled={updatingId === l.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                            >
                              {updatingId === l.id ? (
                                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              VERIFICATĂ
                            </button>
                          )}
                          {l.status === "VERIFICATA" && (
                            <button
                              onClick={() => handleStatusChange(l, "TRIMISA")}
                              disabled={updatingId === l.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                            >
                              {updatingId === l.id ? (
                                <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              TRIMISĂ
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(l)}
                              disabled={deletingId === l.id}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                              title="Șterge listă"
                            >
                              {deletingId === l.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-400">{filtered.length} înregistrări afișate din {lists.length} total</p>
          </div>
        )}
      </div>
    </div>
  );
}