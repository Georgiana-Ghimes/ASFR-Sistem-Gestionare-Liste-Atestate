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
    din_cadrul: "",
    functie: "",
    observatii: "",
  });
  const [pdfFiles, setPdfFiles] = useState([]); // Multiple files
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
    const files = Array.from(e.target.files);
    
    if (files.length > 3) {
      setError("Puteți încărca maxim 3 fișiere.");
      return;
    }
    
    for (const file of files) {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError("Sunt acceptate doar fișiere PDF sau Word (.doc, .docx).");
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setError("Dimensiunea fiecărui fișier nu poate depăși 50MB.");
        return;
      }
    }
    
    setPdfFiles(files);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.numar_atestat.trim()) { setError("Seria este obligatorie."); return; }
    if (!form.data_atestat) { setError("Data atestatului / Procesului Verbal este obligatorie."); return; }
    if (!form.nume_complet.trim()) { setError("Numele complet este obligatoriu."); return; }
    if (!form.din_cadrul.trim()) { setError("Câmpul 'Din cadrul' este obligatoriu."); return; }
    if (!form.functie.trim()) { setError("Specialitatea este obligatorie."); return; }
    if (pdfFiles.length === 0) { 
      setError("Trebuie să încărcați cel puțin un fișier."); 
      return; 
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('numar_atestat', form.numar_atestat.trim());
      formData.append('data_atestat', form.data_atestat);
      formData.append('nume_complet', form.nume_complet.trim());
      formData.append('din_cadrul', form.din_cadrul.trim());
      formData.append('functie', form.functie.trim());
      formData.append('observatii', form.observatii || '');
      
      // Append all PDF files
      pdfFiles.forEach((file, index) => {
        if (file) {
          formData.append(`pdf${index + 1}`, file);
        }
      });

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
        <h1 className="text-2xl font-bold text-gray-900">Încărcare Atestate</h1>
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
              Seria <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.numar_atestat}
              onChange={(e) => setForm({ ...form, numar_atestat: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              placeholder="ex: ISF4/42 Nr. 29"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data Atestat / Proces Verbal <span className="text-red-500">*</span>
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
              Din cadrul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.din_cadrul}
              onChange={(e) => setForm({ ...form, din_cadrul: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              placeholder="ex: VIA TERRA SPEDITION SRL"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Specialitate <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.functie}
              onChange={(e) => setForm({ ...form, functie: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              placeholder="ex: Tracțiune"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fișiere <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">Încărcați exemplarele 1, 2, 3 (maxim 3 fișiere, PDF sau Word)</p>
          
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-pink-300 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {pdfFiles.length > 0 ? (
              <div className="space-y-2">
                {pdfFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-6 h-6 text-pink-500 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">Click pentru a selecta fișiere (exemplarele 1, 2, 3)</p>
                <p className="text-xs text-gray-400 mt-1">Maxim 3 fișiere, 50MB per fișier</p>
                <p className="text-xs text-gray-400">Format: PDF sau Word (.doc, .docx)</p>
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
