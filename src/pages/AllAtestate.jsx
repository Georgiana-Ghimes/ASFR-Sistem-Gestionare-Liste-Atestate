import React, { useState, useEffect } from "react";
import { Award, AlertCircle, Download, Loader2, Trash2 } from "lucide-react";
import { apiClient } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";

export default function AllAtestate({ user }) {
  const [activeTab, setActiveTab] = useState("lista");
  const [atestate, setAtestate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const isGeorgiana = user?.email === 'georgiana.ghimes@sigurantaferoviara.ro';
  const isCecilia = user?.email === 'cecilia.mihaila@sigurantaferoviara.ro';
  const canEditStatus = isGeorgiana || isCecilia;

  useEffect(() => {
    if (activeTab === "lista") {
      loadAtestate();
    }
  }, [activeTab]);

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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-pink-600" />
          <h1 className="text-2xl font-bold text-gray-900">Administrare Atestate</h1>
        </div>
        <p className="text-gray-500 text-sm">Vizualizare și gestionare toate atestatele</p>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ISF / CISF / SCSC</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Seria</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data Atestat</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nume Complet</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Din cadrul</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Specialitate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Creat La</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Verificat La</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trimis La</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {atestate.map((atestat) => (
                    <tr key={atestat.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">{atestat.organization_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{atestat.numar_atestat}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(atestat.data_atestat).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{atestat.nume_complet}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{atestat.din_cadrul}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{atestat.functie}</td>
                      <td className="px-6 py-4">
                        {canEditStatus ? (
                          <select
                            value={atestat.status || 'PRIMITA'}
                            onChange={(e) => handleStatusChange(atestat.id, e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500"
                          >
                            <option value="PRIMITA">PRIMITĂ</option>
                            <option value="VERIFICATA">VERIFICATĂ</option>
                            <option value="TRIMISA">TRIMISĂ</option>
                          </select>
                        ) : (
                          <StatusBadge status={atestat.status || 'PRIMITA'} />
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(atestat.created_date)}</td>
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(atestat.verificat_at)}</td>
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(atestat.trimis_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(atestat.id, atestat.numar_atestat)}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
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
        </div>
      )}
    </div>
  );
}
