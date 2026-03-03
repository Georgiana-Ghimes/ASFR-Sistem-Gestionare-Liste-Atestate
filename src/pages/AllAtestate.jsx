import React, { useState, useEffect } from "react";
import { Award, AlertCircle, Download, Loader2 } from "lucide-react";
import { apiClient } from "@/api/client";

export default function AllAtestate({ user }) {
  const [activeTab, setActiveTab] = useState("lista");
  const [atestate, setAtestate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Seria</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data Atestat</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nume Complet</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Din cadrul</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Specialitate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {atestate.map((atestat) => (
                    <tr key={atestat.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">{atestat.numar_atestat}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(atestat.data_atestat).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{atestat.nume_complet}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{atestat.din_cadrul}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{atestat.functie}</td>
                      <td className="px-6 py-4">
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
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Baza de Evidență</h2>
            <p className="text-gray-500 text-sm">Funcționalitatea pentru baza de evidență va fi adăugată în curând.</p>
          </div>
        </div>
      )}
    </div>
  );
}
