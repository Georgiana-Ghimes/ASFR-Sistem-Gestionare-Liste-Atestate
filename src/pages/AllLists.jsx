import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import StatusBadge from "../components/StatusBadge";
import PDFViewerModal from "../components/PDFViewerModal";
import { Search, ChevronUp, ChevronDown, Filter, Download, Eye, Trash2, List } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";

const COLUMNS = [
  { label: "", col: null }, // Empty column for NOU badge
  { label: "ISF / CISF / SCSC", col: "isf_name" },
  { label: "Nr. Comisie", col: "numar_lista" },
  { label: "Tip", col: "tip" },
  { label: "Nr. Aut./Exam.", col: "numar_autorizatii" },
  { label: "Status", col: "status" },
  { label: "Urcată de", col: "created_date" },
  { label: "Verificată de", col: "verificat_at" },
  { label: "Trimisă de", col: "trimis_at" },
  { label: "Acțiuni", col: null },
];

export default function AllLists({ user }) {
  const location = useLocation();
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
  const [deletingId, setDeletingId] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    load();
  }, []);

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

  const handleDownloadPDF = (listId, numarLista) => {
    const token = localStorage.getItem('token');
    const url = `${window.location.origin.replace(':5173', ':3001')}/api/liste/${listId}/pdf/${numarLista}.pdf?token=${token}`;
    window.open(url, '_blank');
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiClient.updateListStatus(id, newStatus);
      await load();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Eroare la actualizarea statusului');
    }
  };

  const handleDelete = async (lista) => {
    if (user?.role !== 'admin') return;
    
    if (!confirm(`Sigur doriți să ștergeți lista cu numărul comisiei ${lista.numar_lista}?`)) return;
    
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

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterISF, filterFrom, filterTo, search, itemsPerPage]);

  const handleExport = () => {
    const headers = [
      "ISF / CISF / SCSC", "Număr Comisie", "Tip", "Nr. Autorizații", "Status",
      "Urcat La", "Verificat La", "Trimis La", "Urcat De", "Verificat De", "Trimis De"
    ];
    const rows = filtered.map((l) => [
      l.isf_name || "",
      l.numar_lista || "",
      l.tip || "",
      l.numar_autorizatii || "",
      l.status || "",
      l.created_date ? format(new Date(l.created_date), "dd.MM.yyyy HH:mm") : "",
      l.verificat_at ? format(new Date(l.verificat_at), "dd.MM.yyyy HH:mm") : "",
      l.trimis_at ? format(new Date(l.trimis_at), "dd.MM.yyyy HH:mm") : "",
      l.created_by_email || "",
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
          <div className="flex items-center gap-3 mb-2">
            <List className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Administrare Liste</h1>
          </div>
          <p className="text-gray-500 text-sm">Gestionarea completă a tuturor listelor de tipărire autorizații.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
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
          <div>
            <label className="block text-xs text-gray-500 mb-1">Căutare</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Număr comisie..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ISF / CISF / SCSC</label>
            <select
              value={filterISF}
              onChange={(e) => setFilterISF(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toate ISF-urile</option>
              {allISFs.map((isf) => (
                <option key={isf} value={isf}>{isf}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Toate statusurile</option>
              <option value="PRIMITA">PRIMITĂ</option>
              <option value="VERIFICATA">VERIFICATĂ</option>
              <option value="TRIMISA">TRIMISĂ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Urcat de la</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Până la</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-6 py-16 text-center text-gray-400 text-sm">
                      Nu există liste care să corespundă filtrelor selectate.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((l) => (
                    <tr 
                      key={l.id} 
                      id={`list-row-${l.id}`}
                      className={`transition-colors ${
                        highlightId === l.id 
                          ? 'animate-pulse-green' 
                          : l.status === 'PRIMITA' 
                            ? 'bg-yellow-50 hover:bg-yellow-100' 
                            : l.status === 'TRIMISA' 
                              ? 'bg-green-50 hover:bg-green-100' 
                              : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-3 py-2 text-center">
                        {l.status === 'PRIMITA' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-yellow-700 bg-yellow-200 border border-yellow-300">
                            NOU!
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 text-center">{l.isf_name}</td>
                      <td className="px-3 py-2 text-xs font-bold text-gray-900 text-center">{l.numar_lista}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 text-center">{l.tip || "-"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 text-center">{l.numar_autorizatii}</td>
                      <td className="px-3 py-2 text-center">
                        {user?.role === 'admin' ? (
                          <select
                            value={l.status || 'PRIMITA'}
                            onChange={(e) => handleStatusChange(l.id, e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 mx-auto"
                          >
                            <option value="PRIMITA">PRIMITĂ</option>
                            <option value="VERIFICATA">VERIFICATĂ</option>
                            <option value="TRIMISA">TRIMISĂ</option>
                          </select>
                        ) : (
                          <div className="flex justify-center">
                            <StatusBadge status={l.status} />
                          </div>
                        )}
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
                        <div className="flex items-center gap-1">
                          {l.pdf_url && (
                            <>
                              <button
                                onClick={() => setPdfModal({ url: l.pdf_url, filename: l.pdf_filename })}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Vizualizare PDF"
                              >
                                <Eye className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleDownloadPDF(l.id, l.numar_lista)}
                                className="p-1 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg transition-colors"
                                title="Descarcă PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {user?.email === 'georgiana.ghimes@sigurantaferoviara.ro' && (
                            <button
                              onClick={() => handleDelete(l)}
                              disabled={deletingId === l.id}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
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
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-xs text-gray-400">
                Afișare {startIndex + 1}-{Math.min(endIndex, filtered.length)} din {filtered.length} înregistrări
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Intrări per pagină:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prima
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-xs text-gray-600">
                  Pagina {currentPage} din {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Următor
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ultima
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
