import React, { useState, useEffect } from "react";
import { Award, AlertCircle, Download, Loader2, Eye } from "lucide-react";
import { apiClient } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import PDFViewerModal from "@/components/PDFViewerModal";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";

export default function MyAtestate({ user }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("lista");
  const [atestate, setAtestate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [pdfModal, setPdfModal] = useState(null);
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!user || !user.has_atestate_role) return;
      try {
        const data = await apiClient.getMyAtestate();
        setAtestate(data);
      } catch (error) {
        console.error('Failed to load atestate:', error);
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

  const handleExport = () => {
    const headers = [
      "Seria", "Numărul", "Data Atestat", "Nume Complet", "Din cadrul", 
      "Specialitate", "Status", "Urcat La", "Verificat La", "Trimis La", 
      "Urcat De", "Verificat De", "Trimis De"
    ];
    const rows = atestate.map((a) => [
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
    a.download = `atestatele-mele-export-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user || !user.has_atestate_role) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">Acces neautorizat. Doar utilizatorii cu rol de Atestate pot accesa această pagină.</p>
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
            <Award className="w-8 h-8 text-pink-600" />
            <h1 className="text-2xl font-bold text-gray-900">Atestatele mele</h1>
          </div>
          <p className="text-gray-500 text-sm">Vizualizare și gestionare atestate proprii</p>
        </div>
        {activeTab === "lista" && atestate.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Tabs */}
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
            {user.email === 'cecilia.mihaila@sigurantaferoviara.ro' && (
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
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === "lista" ? (
          loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
            </div>
          ) : atestate.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Niciun atestat</h2>
              <p className="text-gray-500 text-sm">Nu aveți atestate încărcate.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Seria</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Numărul</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Data</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Nume</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Din cadrul</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Specialitate</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Urcată de</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Verificată de</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Trimisă de</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {atestate.map((a) => (
                    <tr 
                      key={a.id} 
                      id={`atestat-row-${a.id}`}
                      className={`transition-colors ${
                        highlightId === a.id 
                          ? 'animate-pulse-green' 
                          : a.status === 'TRIMISA' 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-900 text-center">{a.numar_atestat}</td>
                      <td className="px-3 py-2 text-xs text-gray-900 text-center font-bold">{a.numar_atestat_format || '-'}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap text-center">
                        {new Date(a.data_atestat).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 text-center">{a.nume_complet}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 text-center">{a.din_cadrul}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 text-center">{a.functie}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center">
                          <StatusBadge status={a.status || 'PRIMITA'} />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 text-center">
                        {a.created_date ? (
                          <>
                            <div>{format(new Date(a.created_date), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(a.created_date), "HH:mm")}</div>
                            {a.created_by_email && <div className="text-[10px]">({a.created_by_email})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 text-center">
                        {a.verificat_at ? (
                          <>
                            <div>{format(new Date(a.verificat_at), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(a.verificat_at), "HH:mm")}</div>
                            {a.verificat_by && <div className="text-[10px]">({a.verificat_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 text-center">
                        {a.trimis_at ? (
                          <>
                            <div>{format(new Date(a.trimis_at), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(a.trimis_at), "HH:mm")}</div>
                            {a.trimis_by && <div className="text-[10px]">({a.trimis_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDownload(a.id, a.numar_atestat_format)}
                            disabled={downloading === a.id}
                            className="p-1 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 disabled:opacity-50 transition-colors"
                            title="Descarcă fișiere (ZIP)"
                          >
                            {downloading === a.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
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
    </div>
  );
}
