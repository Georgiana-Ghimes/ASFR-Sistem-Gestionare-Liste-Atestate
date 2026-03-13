import { useState } from "react";
import { FileText, AlertCircle, CheckCircle, Save, Upload } from "lucide-react";
import { apiClient } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function CreateDre({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    nr_declaratie_part1: "",
    nr_declaratie_part2: "",
    nr_declaratie_part3: "",
    nume_examinator: "",
    tip_declaratie: "noua",
    limba_evaluare: "",
    data_emitere: "",
    data_expirare: "",
    material_rulant_teoretic: false,
    material_rulant_practic: false,
    infrastructura_teoretic: false,
    infrastructura_practic: false
  });

  const isFlorin = user?.email === 'florin.hritcu@sigurantaferoviara.ro';
  const isRegularUser = ['isf', 'cisf', 'scsc'].includes(user?.role);
  const hasDreRole = user?.has_dre_role;
  const canAccess = user?.role === 'admin' || isFlorin || (isRegularUser && hasDreRole);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
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
    
    setAttachments(files);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.nr_declaratie_part1.trim() || !formData.nr_declaratie_part2.trim() || !formData.nr_declaratie_part3.trim()) { 
      setError("Toate părțile numărului declarației sunt obligatorii."); 
      return; 
    }
    if (!formData.nume_examinator.trim()) { setError("Numele examinatorului este obligatoriu."); return; }
    if (!formData.limba_evaluare || !formData.limba_evaluare.trim()) { setError("Limba de evaluare este obligatorie."); return; }
    if (!formData.data_emitere) { setError("Data emiterii este obligatorie."); return; }
    if (!formData.data_expirare) { setError("Data expirării este obligatorie."); return; }
    
    setLoading(true);
    
    try {
      // Combine the three parts into nr_declaratie
      const nr_declaratie = `${formData.nr_declaratie_part1}/${formData.nr_declaratie_part2}/${formData.nr_declaratie_part3}`;
      
      const formDataToSend = new FormData();
      
      // Add all form fields
      formDataToSend.append('nr_declaratie', nr_declaratie);
      formDataToSend.append('nume_examinator', formData.nume_examinator);
      formDataToSend.append('tip_declaratie', formData.tip_declaratie);
      formDataToSend.append('limba_evaluare', formData.limba_evaluare);
      formDataToSend.append('data_emitere', formData.data_emitere);
      formDataToSend.append('data_expirare', formData.data_expirare);
      formDataToSend.append('material_rulant_teoretic', formData.material_rulant_teoretic);
      formDataToSend.append('material_rulant_practic', formData.material_rulant_practic);
      formDataToSend.append('infrastructura_teoretic', formData.infrastructura_teoretic);
      formDataToSend.append('infrastructura_practic', formData.infrastructura_practic);
      
      // Debug: Log what we're sending
      console.log('Sending DRE data:', {
        nr_declaratie,
        nume_examinator: formData.nume_examinator,
        tip_declaratie: formData.tip_declaratie,
        limba_evaluare: formData.limba_evaluare,
        data_emitere: formData.data_emitere,
        data_expirare: formData.data_expirare,
        attachments_count: attachments.length
      });
      
      // Append all attachment files
      attachments.forEach((file) => {
        formDataToSend.append('files', file);
      });
      
      await apiClient.createDre(formDataToSend);
      setSuccess(true);
      
      // Redirect based on user role
      const redirectPath = user.role === 'admin' || isFlorin ? '/all-dre' : '/my-dre';
      setTimeout(() => navigate(redirectPath), 2000);
    } catch (error) {
      setError(error.message || 'Eroare la crearea DRE');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !canAccess) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">Acces neautorizat. Doar utilizatorii cu rol de DRE pot crea DRE-uri.</p>
        </div>
      </div>
    );
  }

  if (success) {
    const isAdmin = user.role === 'admin' || isFlorin;
    const redirectMessage = isAdmin ? 'Redirectare către administrare DRE...' : 'Redirectare către DRE-urile tale...';
    
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-4 max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">DRE creat cu succes!</h2>
          <p className="text-gray-500 text-center text-sm">{redirectMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Încărcare DRE</h1>
        </div>
        <p className="text-gray-500 mt-1 text-sm">Completați formularul pentru a adăuga un nou DRE.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Examinator Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nume și prenume examinator <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nume_examinator}
              onChange={(e) => setFormData({ ...formData, nume_examinator: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition uppercase"
              placeholder="ex: SARIVAN GEANI"
            />
          </div>

          {/* DRE Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nr. Declarație <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.nr_declaratie_part1}
                  onChange={(e) => setFormData({ ...formData, nr_declaratie_part1: e.target.value.toUpperCase() })}
                  className="w-20 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition uppercase"
                  placeholder="RO 2026"
                />
                <span className="text-gray-400 font-bold">/</span>
                <input
                  type="text"
                  value={formData.nr_declaratie_part2}
                  onChange={(e) => setFormData({ ...formData, nr_declaratie_part2: e.target.value.toUpperCase() })}
                  className="w-16 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition uppercase"
                  placeholder="7GL"
                />
                <span className="text-gray-400 font-bold">/</span>
                <input
                  type="text"
                  value={formData.nr_declaratie_part3}
                  onChange={(e) => setFormData({ ...formData, nr_declaratie_part3: e.target.value })}
                  className="w-16 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tip Declarație <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tip_declaratie}
                onChange={(e) => setFormData({ ...formData, tip_declaratie: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="noua">Nouă</option>
                <option value="reinnoita">Reînnoită</option>
                <option value="modificata">Modificată</option>
              </select>
            </div>
          </div>

          <div className="w-64">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Limba de Evaluare <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.limba_evaluare}
              onChange={(e) => setFormData({ ...formData, limba_evaluare: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            >
              <option value="">Selectează limba</option>
              <option value="Română">Română</option>
            </select>
          </div>

          {/* Competențe */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Domenii de competență examinator
            </label>
            
            {/* Cunoștințe profesionale de material rulant */}
            <div className="mb-4 p-4 bg-blue-50/30 border border-blue-100 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Cunoștințe profesionale de material rulant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evaluare teoretică</label>
                  <select
                    value={formData.material_rulant_teoretic ? "da" : "nu"}
                    onChange={(e) => setFormData({ ...formData, material_rulant_teoretic: e.target.value === "da" })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  >
                    <option value="nu">Nu</option>
                    <option value="da">Da</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evaluare practică</label>
                  <select
                    value={formData.material_rulant_practic ? "da" : "nu"}
                    onChange={(e) => setFormData({ ...formData, material_rulant_practic: e.target.value === "da" })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  >
                    <option value="nu">Nu</option>
                    <option value="da">Da</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cunoștințe profesionale de infrastructură */}
            <div className="p-4 bg-green-50/30 border border-green-100 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Cunoștințe profesionale de infrastructură</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evaluare teoretică</label>
                  <select
                    value={formData.infrastructura_teoretic ? "da" : "nu"}
                    onChange={(e) => setFormData({ ...formData, infrastructura_teoretic: e.target.value === "da" })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  >
                    <option value="nu">Nu</option>
                    <option value="da">Da</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evaluare practică</label>
                  <select
                    value={formData.infrastructura_practic ? "da" : "nu"}
                    onChange={(e) => setFormData({ ...formData, infrastructura_practic: e.target.value === "da" })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  >
                    <option value="nu">Nu</option>
                    <option value="da">Da</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data emitere declarației <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.data_emitere}
                onChange={(e) => setFormData({ ...formData, data_emitere: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valabilitate declarație <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.data_expirare}
                onChange={(e) => setFormData({ ...formData, data_expirare: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Atașamente
            </label>
            <p className="text-xs text-gray-500 mb-3">Încărcați fișiere PDF sau Word (opțional)</p>
            
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-purple-300 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-500 flex-shrink-0" />
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
                  <p className="text-sm text-gray-600 font-medium">Click pentru a selecta fișiere</p>
                  <p className="text-xs text-gray-400 mt-1">Format: PDF sau Word (.doc, .docx) • Maxim 50MB per fișier</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Se salvează...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvează DRE
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
