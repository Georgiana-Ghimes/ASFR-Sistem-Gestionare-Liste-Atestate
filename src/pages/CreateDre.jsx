import { useState } from "react";
import { FileStack, AlertCircle, CheckCircle, Save } from "lucide-react";
import { apiClient } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function CreateDre({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nr_declaratie: "",
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
    
    if (!formData.nr_declaratie.trim()) { setError("Numărul declarației este obligatoriu."); return; }
    if (!formData.nume_examinator.trim()) { setError("Numele examinatorului este obligatoriu."); return; }
    if (!formData.limba_evaluare.trim()) { setError("Limba de evaluare este obligatorie."); return; }
    if (!formData.data_emitere) { setError("Data emiterii este obligatorie."); return; }
    if (!formData.data_expirare) { setError("Data expirării este obligatorie."); return; }
    
    setLoading(true);
    
    try {
      await apiClient.createDre(formData);
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
          <FileStack className="w-8 h-8 text-purple-600" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nr. Declarație <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nr_declaratie}
                onChange={(e) => setFormData({ ...formData, nr_declaratie: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="ex: DRE-2026-001"
              />
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
                <option value="reinnoita">Reînnoire</option>
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
              Competențe
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.material_rulant_teoretic}
                  onChange={(e) => setFormData({ ...formData, material_rulant_teoretic: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Material rulant - Evaluare teoretică</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.material_rulant_practic}
                  onChange={(e) => setFormData({ ...formData, material_rulant_practic: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Material rulant - Evaluare practică</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.infrastructura_teoretic}
                  onChange={(e) => setFormData({ ...formData, infrastructura_teoretic: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Infrastructură - Evaluare teoretică</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.infrastructura_practic}
                  onChange={(e) => setFormData({ ...formData, infrastructura_practic: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Infrastructură - Evaluare practică</span>
              </label>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data Emitere <span className="text-red-500">*</span>
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
                Data Expirare <span className="text-red-500">*</span>
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
