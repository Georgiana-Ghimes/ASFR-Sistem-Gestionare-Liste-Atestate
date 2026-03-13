import { useState } from "react";
import { FileText, AlertCircle, CheckCircle, Save } from "lucide-react";
import { apiClient } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function CreateDre({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.nr_declaratie_part1.trim() || !formData.nr_declaratie_part2.trim() || !formData.nr_declaratie_part3.trim()) { 
      setError("Toate părțile numărului declarației sunt obligatorii."); 
      return; 
    }
    if (!formData.nume_examinator.trim()) { setError("Numele examinatorului este obligatoriu."); return; }
    if (!formData.limba_evaluare.trim()) { setError("Limba de evaluare este obligatorie."); return; }
    if (!formData.data_emitere) { setError("Data emiterii este obligatorie."); return; }
    if (!formData.data_expirare) { setError("Data expirării este obligatorie."); return; }
    
    setLoading(true);
    
    try {
      // Combine the three parts into nr_declaratie
      const nr_declaratie = `${formData.nr_declaratie_part1}/${formData.nr_declaratie_part2}/${formData.nr_declaratie_part3}`;
      
      const dataToSend = {
        ...formData,
        nr_declaratie
      };
      
      // Remove the individual parts from the data sent to API
      delete dataToSend.nr_declaratie_part1;
      delete dataToSend.nr_declaratie_part2;
      delete dataToSend.nr_declaratie_part3;
      
      await apiClient.createDre(dataToSend);
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Limba de Evaluare <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.limba_evaluare}
              onChange={(e) => setFormData({ ...formData, limba_evaluare: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="ex: Română"
            />
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
