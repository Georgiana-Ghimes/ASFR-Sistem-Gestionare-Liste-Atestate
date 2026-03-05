import React, { useState, useEffect } from "react";
import { Award, AlertCircle, Download, Loader2, Eye } from "lucide-react";
import { apiClient } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import PDFViewerModal from "@/components/PDFViewerModal";
import { format } from "date-fns";

export default function MyAtestate({ user }) {
  const [activeTab, setActiveTab] = useState("lista");
  const [atestate, setAtestate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [pdfModal, setPdfModal] = useState(null);

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

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-pink-600" />
          <h1 className="text-2xl font-bold text-gray-900">Atestatele mele</h1>
        </div>
        <p className="text-gray-500 text-sm">Vizualizare și gestionare atestate proprii</p>
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
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Seria</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Nume</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Din cadrul</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Specialitate</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Urcată de</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Verificată de</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Trimisă de</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {atestate.map((a) => (
                    <tr key={a.id} className={`transition-colors ${
                      a.status === 'TRIMISA' ? 'bg-green-50 hover:bg-green-100' : 
                      'hover:bg-gray-50/50'
                    }`}>
                      <td className="px-3 py-2 text-xs text-gray-900">{a.numar_atestat}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(a.data_atestat).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">{a.nume_complet}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{a.din_cadrul}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{a.functie}</td>
                      <td className="px-3 py-2"><StatusBadge status={a.status || 'PRIMITA'} /></td>
                      <td className="px-3 py-2 text-xs text-gray-400">
                        {a.created_date ? (
                          <>
                            <div>{format(new Date(a.created_date), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(a.created_date), "HH:mm")}</div>
                            {a.created_by_email && <div className="text-[10px]">({a.created_by_email})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400">
                        {a.verificat_at ? (
                          <>
                            <div>{format(new Date(a.verificat_at), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(a.verificat_at), "HH:mm")}</div>
                            {a.verificat_by && <div className="text-[10px]">({a.verificat_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400">
                        {a.trimis_at ? (
                          <>
                            <div>{format(new Date(a.trimis_at), "dd.MM.yyyy")}</div>
                            <div>{format(new Date(a.trimis_at), "HH:mm")}</div>
                            {a.trimis_by && <div className="text-[10px]">({a.trimis_by})</div>}
                          </>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDownload(a.id, a.numar_atestat)}
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
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-pink-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Baza de Evidență</h2>
            <p className="text-gray-500 text-sm mb-6">Accesați documentul Google Sheets pentru a edita baza de evidență.</p>
            <a
              href="https://docs.google.com/spreadsheets/d/1SE7OeNZ_LjkX1Q6-nFgTAx2tKg6hLy7v/edit?gid=337912100#gid=337912100"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              Deschide Baza de Evidență
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
