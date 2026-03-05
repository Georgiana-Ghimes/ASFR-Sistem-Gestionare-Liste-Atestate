import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { Upload, Save, AlertCircle, CheckCircle, FileText } from "lucide-react";

export default function CreateList({ user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    numar_lista: "",
    data_lista: "",
    numar_autorizatii: "",
    isf_name: "",
    observatii: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      // Use isf-cisf-list endpoint which is accessible to all authenticated users
      const orgNames = await apiClient.getIsfCisfList();
      
      // For admin users, get full user list to map names to types
      let orgs = [];
      if (user.role === 'admin') {
        const users = await apiClient.getAllUsers();
        orgs = users
          .filter(u => u.isf_name || u.cisf_name || u.scsc_name)
          .map(u => ({
            type: u.role,
            name: u.isf_name || u.cisf_name || u.scsc_name
          }))
          .filter((org, index, self) => 
            index === self.findIndex(o => o.name === org.name)
          )
          .sort((a, b) => a.name.localeCompare(b.name));
      } else {
        // For non-admin, create org object from user data
        const userOrgName = user.isf_name || user.cisf_name || user.scsc_name;
        if (userOrgName) {
          orgs = [{
            type: user.role,
            name: userOrgName
          }];
        }
      }
      
      setOrganizations(orgs);

      // Pre-select organization
      const userOrgName = user.isf_name || user.cisf_name || user.scsc_name;
      
      if (userOrgName) {
        setForm(prev => ({
          ...prev,
          isf_name: userOrgName
        }));
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoadingList(false);
    }
  };

  if (!user || !['isf', 'cisf', 'scsc', 'admin'].includes(user.role)) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">Acces neautorizat. Doar utilizatorii ISF, CISF și SCSC pot crea liste.</p>
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

    if (!form.numar_lista.trim()) { setError("Numărul listei este obligatoriu."); return; }
    if (!form.data_lista) { setError("Data listei este obligatorie."); return; }
    if (!form.isf_name) { setError("ISF/CISF/SCSC este obligatoriu."); return; }
    if (!form.numar_autorizatii || parseInt(form.numar_autorizatii) < 1) {
      setError("Numărul de autorizații trebuie să fie cel puțin 1."); return;
    }
    if (!pdfFile) { setError("Fișierul PDF este obligatoriu."); return; }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('numar_lista', form.numar_lista.trim());
      formData.append('data_lista', form.data_lista);
      formData.append('isf_name', form.isf_name);
      formData.append('numar_autorizatii', form.numar_autorizatii);
      formData.append('observatii', form.observatii || '');
      formData.append('pdf', pdfFile);

      await apiClient.createList(formData);
      setSuccess(true);
      setTimeout(() => navigate('/my-lists'), 2000);
    } catch (err) {
      setError(err.message || 'Eroare la crearea listei');
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
          <h2 className="text-xl font-bold text-gray-900">Listă creată cu succes!</h2>
          <p className="text-gray-500 text-center text-sm">Redirectare către listele tale...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Încărcare Liste</h1>
        <p className="text-gray-500 mt-1 text-sm">Completați formularul pentru a adăuga o nouă listă de tipărire autorizații.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ISF / CISF / SCSC <span className="text-red-500">*</span>
            </label>
            {loadingList ? (
              <div className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500">Se încarcă...</span>
              </div>
            ) : user.role === 'admin' ? (
              <select
                value={form.isf_name}
                onChange={(e) => setForm({ ...form, isf_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="">Selectează ISF / CISF / SCSC</option>
                {organizations.map((org) => (
                  <option key={org.name} value={org.name}>
                    {org.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 font-medium">
                {form.isf_name || 'Se încarcă...'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Număr Listă <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.numar_lista}
              onChange={(e) => setForm({ ...form, numar_lista: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="ex: L-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data Listă <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.data_lista}
              onChange={(e) => setForm({ ...form, data_lista: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Număr Autorizații <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.numar_autorizatii}
              onChange={(e) => setForm({ ...form, numar_autorizatii: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="ex: 25"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fișier PDF <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {pdfFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
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
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
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
                Salvează Lista
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}