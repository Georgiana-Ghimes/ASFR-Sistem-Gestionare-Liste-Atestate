import React, { useState } from "react";
import { apiClient } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { Upload, Save, AlertCircle, CheckCircle, FileText } from "lucide-react";

export default function CreateAtestat({ user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    numar_atestat: "",
    data_atestat: "",
    nume_complet: "",
    cnp: "",
    functie: "",
    observatii: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user || (!user.has_atestate_role && user.role !== 'admin')) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">Acces neautorizat. Doar utilizatorii cu rol de Atestate pot crea atestate.</p>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Sunt acceptate doar fișiere PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Dimensiunea fișierului nu poate depăși 10MB.");
      return;
    }
    setPdfFile(file);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.numar_atestat.trim()) { setError("Numărul atestatului este obligatoriu."); return; }
    if (!form.data_atestat) { setError("Data atestatului este obligatorie."); return; }
    if (!form.nume_complet.trim()) { setError("Numele complet este obligatoriu."); return; }
    if (!form.cnp.trim()) { setError("CNP-ul este obligatoriu."); return; }
    if (form.cnp.length !== 13) { setError("CNP-ul trebuie să aibă 13 caractere."); return; }
    if (!form.functie.trim()) { setError("Funcția este obligatorie."); return; }
    if (!pdfFile) { setError("Fișierul PDF este obligatoriu."); return; }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('numar_atestat', form.numar_atestat.trim());
      formData.append('data_atestat', form.data_atestat);
      formData.append('nume_complet', form.nume_complet.trim());
      formData.append('cnp', form.cnp.trim());
      formData.append('functie', form.functie.trim());
      formData.append('observatii', form.observatii || '');
      formData.append('pdf', pdfFile);

      await apiClient.createAtestat(formData);
      setSuccess(true);
      setTimeout(() => navigate('/my-atestate'), 2000);
    } catch (err) {
      setError(err.message || 'Eroare la crearea atestatului');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-4 max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Atestat creat cu succes!</h2>
          <p className="text-gray-500 text-center text-sm">Redirectare către atestatele tale...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Creare Atestat Nou</h1>
        <p className="text-gray-500 mt-1 text-sm">Completați formularul pentru a adăuga un nou atestat.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Număr Atestat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.numar_atestat}
              onChange={(e) => setForm({ ...form, numar_atestat: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              placeholder="ex: AT-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data Atestat <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.data_atestat}
              onChange={(e) => setForm({ ...form, data_atestat: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nume Complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nume_complet}
              onChange={(e) => setForm({ ...form, nume_complet: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              placeholder="ex: Popescu Ion"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CNP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={13}
              value={form.cnp}
              onChange={(e) => setForm({ ...form, cnp: e.target.value.replace(/\D/g, '') })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              placeholder="ex: 1234567890123"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Funcție <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.functie}
              onChange={(e) => setForm({ ...form, functie: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              placeholder="ex: Mecanic"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fișier PDF <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-pink-300 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {pdfFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-pink-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{pdfFile.name}</p>
                  <p className="text-xs text-gray-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">Click pentru a selecta fișierul PDF</p>
                <p className="text-xs text-gray-400 mt-1">Maxim 10MB, doar fișiere .pdf</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Observații</label>
          <textarea
            value={form.observatii}
            onChange={(e) => setForm({ ...form, observatii: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition resize-none"
            placeholder="Observații opționale..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Se salvează...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvează Atestatul
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
