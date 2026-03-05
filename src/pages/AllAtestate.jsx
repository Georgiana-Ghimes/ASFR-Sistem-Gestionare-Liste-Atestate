import React, { useState, useEffect } from "react";
import { Award, AlertCircle, Download, Loader2, Trash2, Search, Filter } from "lucide-react";
import { apiClient } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";

export default function AllAtestate({ user }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("lista");
  const [atestate, setAtestate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterOrg, setFilterOrg] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");
  const [highlightId, setHighlightId] = useState(null);

  const isGeorgiana = user?.email === 'georgiana.ghimes@sigurantaferoviara.ro';

  useEffect(() => {
    if (activeTab === "lista") {
      loadAtestate();
    }
  }, [activeTab]);

  useEffect(() => {
    // Handle highlight from navigation state
    if (location.state?.highlightId) {
      setHighlightId(location.state.highlightId);
      
      // Scroll to the row after a short delay
      setTimeout(() => {
        const row = document.getElementById(`atestat-row-${location.state.highlightId}`);
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

  const loadAtestate = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAllAtestate();
      setAtestate(data);
    } catch (error) {
      console.error('Failed to load atestate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id, numarAtestat) => {
    try {
      setDownloading(id);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/atestate/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atestat_${numarAtestat}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Eroare la descărcarea fișierelor');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (id, numarAtestat) => {
    if (!confirm(`Sigur doriți să ștergeți atestatul "${numarAtestat}"?`)) {
      return;
    }

    try {
      setDeleting(id);
      await apiClient.deleteAtestat(id);
      setAtestate(atestate.filter(a => a.id !== id));
      alert('Atestat șters cu succes!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Eroare la ștergerea atestatului');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiClient.updateAtestatStatus(id, newStatus);
      await loadAtestate();
    } catch (error) {
      console.error('Status update error:', error);
      alert('Eroare la actualizarea statusului');
    }
  };

  const handleExport = () => {
    const headers = [
      "ISF / CISF / SCSC", "Seria", "Numărul", "Data Atestat", "Nume Complet", "Din cadrul", 
      "Specialitate", "Status", "Urcat La", "Verificat La", "Trimis La", 
      "Urcat De", "Verificat De", "Trimis De"
    ];
    const rows = filtered.map((a) => [
      a.organization_name || "",
      a.numar_atestat || "",
      a.numar_atestat_format || "",
      a.data_atestat ? format(new Date(a.data_atestat), "dd.MM.yyyy") : "",
      a.nume_complet || "",
      a.din_cadrul || "",
      a.functie || "",
      a.status || "",
      a.created_date ? format(new Date(a.created_date), "dd.MM.yyyy HH:mm") : "",
      a.verificat_at ? format(new Date(a.verificat_at), "dd.MM.yyyy HH:mm") : "",
      a.trimis_at ? format(new Date(a.trimis_at), "dd.MM.yyyy HH:mm") : "",
      a.created_by_email || "",
      a.verificat_by || "",
      a.trimis_by || "",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atestate-export-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allOrgs = [...new Set(atestate.map((a) => a.organization_name).filter(Boolean))].sort();

  const filtered = atestate
    .filter((a) => {
      if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
      if (filterOrg && a.organization_name !== filterOrg) return false;
      if (filterFrom && a.created_date < filterFrom) return false;
      if (filterTo && a.created_date > filterTo) return false;
      if (search && !a.numar_atestat_format?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  const fmtDate = (dt) => dt ? format(new Date(dt), "dd.MM.yyyy HH:mm") : "-";

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">Acces neautorizat. Doar administratorii pot accesa această pagină.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-pink-600" />
            <h1 className="text-2xl font-bold text-gray-900">Administrare Atestate</h1>
          </div>
          <p className="text-gray-500 text-sm">Vizualizare și gestionare toate atestatele</p>
        </div>
        {activeTab === "lista" && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Tabs - only visible for Cecilia */}
      {user.email === 'cecilia.mihaila@sigurantaferoviara.ro' && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("lista")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "lista"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Lista Atestate
              </button>
              <button
                onClick={() => setActiveTab("baza")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "baza"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Baza de Evidență
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Filters */}
      {activeTab === "lista" && (
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
                  placeholder="Numărul..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ISF / CISF / SCSC</label>
              <select
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Toate ISF-urile</option>
                {allOrgs.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Până la</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "lista" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
            </div>
          ) : atestate.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Niciun atestat</h2>
              <p className="text-gray-500 text-sm">Nu există atestate încărcate în sistem.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase"></th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">ISF / CISF / SCSC</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Seria</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Numărul</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Data</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Nume</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Din cadrul</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Specialitate</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Urcată de</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Verificată de</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trimisă de</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-6 py-16 text-center text-gray-400 text-sm">
                        Nu există atestate care să corespundă filtrelor selectate.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((atestat) => (
                    <tr 
                      key={atestat.id} 
                      id={`atestat-row-${atestat.id}`}
                      className={`transition-colors ${
                        highlightId === atestat.id 
                          ? 'animate-pulse-green' 
                          : atestat.status === 'PRIMITA' 
                            ? 'bg-yellow-50 hover:bg-yellow-100' 
                            : atestat.status === 'TRIMISA' 
                              ? 'bg-green-50 hover:bg-green-100' 
                              : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        {atestat.status === 'PRIMITA' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-yellow-700 bg-yellow-200 border border-yellow-300">
                            NOU!
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-900 text-center">{atestat.organization_name || '-'}</td>
                      <td className="px-3 py-3 text-xs text-gray-900 text-center">{atestat.numar_atestat}</td>
                      <td className="px-3 py-3 text-xs text-gray-900 text-center font-bold">{atestat.numar_atestat_format || '-'}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap text-center">
                        {new Date(atestat.data_atestat).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-900 text-center">{atestat.nume_complet}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 text-center">{atestat.din_cadrul}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 text-center">{atestat.functie}</td>
                      <td className="px-3 py-2 text-center">
                        {user?.role === 'admin' ? (
                          <select
                            value={atestat.status || 'PRIMITA'}
                            onChange={(e) => handleStatusChange(atestat.id, e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 mx-auto"
                          >
                            <option value="PRIMITA">PRIMITĂ</option>
                            <option value="VERIFICATA">VERIFICATĂ</option>
                            <option value="TRIMISA">TRIMISĂ</option>
                          </select>
                        ) : (
                          <div className="flex justify-center">
                            <StatusBadge status={atestat.status || 'PRIMITA'} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400 text-center">
                        {atestat.created_date ? (
                          <>
                            <div>{format(new Date(atestat.created_date), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(atestat.created_date), "HH:mm")}</div>
                            {atestat.created_by_email && <div className="text-[10px]">({atestat.created_by_email})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400 text-center">
                        {atestat.verificat_at ? (
                          <>
                            <div>{format(new Date(atestat.verificat_at), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(atestat.verificat_at), "HH:mm")}</div>
                            {atestat.verificat_by && <div className="text-[10px]">({atestat.verificat_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400 text-center">
                        {atestat.trimis_at ? (
                          <>
                            <div>{format(new Date(atestat.trimis_at), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(atestat.trimis_at), "HH:mm")}</div>
                            {atestat.trimis_by && <div className="text-[10px]">({atestat.trimis_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDownload(atestat.id, atestat.numar_atestat_format)}
                            disabled={downloading === atestat.id}
                            className="p-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 disabled:opacity-50 transition-colors"
                            title="Descarcă fișiere (ZIP)"
                          >
                            {downloading === atestat.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                          {isGeorgiana && (
                            <button
                              onClick={() => handleDelete(atestat.id, atestat.numar_atestat)}
                              disabled={deleting === atestat.id}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                              title="Șterge atestat"
                            >
                              {deleting === atestat.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
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
        </div>
      ) : (
        <div className="fixed top-[11rem] left-64 right-0 bottom-0 bg-white z-10">
          <iframe
            src="https://docs.google.com/spreadsheets/d/1SE7OeNZ_LjkX1Q6-nFgTAx2tKg6hLy7v/edit?gid=337912100&rm=minimal"
            className="w-full h-full border-0"
            title="Baza de Evidență"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}
    </div>
  );
}
