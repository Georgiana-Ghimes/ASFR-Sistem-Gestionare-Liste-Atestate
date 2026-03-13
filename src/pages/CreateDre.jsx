import { useState, useEffect } from "react";
import { FileText, AlertCircle, CheckCircle, Save, Upload } from "lucide-react";
import { apiClient } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function CreateDre({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  
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
    infrastructura_practic: false,
    organization_name: ""
  });

  const isFlorin = user?.email === 'florin.hritcu@sigurantaferoviara.ro';
  const isRegularUser = ['isf', 'cisf', 'scsc'].includes(user?.role);
  const hasDreRole = user?.has_dre_role;
  const canAccess = user?.role === 'admin' || isFlorin || (isRegularUser && hasDreRole);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user) {
      // Pre-select organization for non-admin users immediately
      if (!isAdmin && !isFlorin) {
        const userOrgName = user.isf_name || user.cisf_name || user.scsc_name;
        if (userOrgName) {
          setFormData(prev => ({
            ...prev,
            organization_name: userOrgName
          }));
        }
      } else {
        // Load organizations only for admin users
        loadOrganizations();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-calculate data_expirare when data_emitere or tip_declaratie changes
  useEffect(() => {
    if (formData.data_emitere) {
      const emitereDate = new Date(formData.data_emitere);
      const expirareDate = new Date(emitereDate);
      
      if (formData.tip_declaratie === 'noua') {
        // Add 2 years and 1 day for "noua"
        expirareDate.setFullYear(expirareDate.getFullYear() + 2);
        expirareDate.setDate(expirareDate.getDate() + 1);
      } else if (formData.tip_declaratie === 'reinnoita') {
        // Add 5 years and 1 day for "reinnoita"
        expirareDate.setFullYear(expirareDate.getFullYear() + 5);
        expirareDate.setDate(expirareDate.getDate() + 1);
      }
      
      // Only auto-calculate for "noua" and "reinnoita", not for "modificata"
      if (formData.tip_declaratie === 'noua' || formData.tip_declaratie === 'reinnoita') {
        // Format as YYYY-MM-DD for input[type="date"]
        const formattedDate = expirareDate.toISOString().split('T')[0];
        
        setFormData(prev => ({
          ...prev,
          data_expirare: formattedDate
        }));
      }
    }
  }, [formData.data_emitere, formData.tip_declaratie]);

  // Check for existing examinator when tip_declaratie is "modificata"
  useEffect(() => {
    const checkExaminator = async () => {
      console.log('[DRE Check] Checking examinator:', {
        tip: formData.tip_declaratie,
        nume: formData.nume_examinator,
        org: formData.organization_name
      });
      
      if (formData.tip_declaratie === 'modificata' && 
          formData.nume_examinator.trim() && 
          formData.organization_name) {
        try {
          console.log('[DRE Check] Making API call...');
          const result = await apiClient.checkExaminatorDre(
            formData.nume_examinator.trim(),
            formData.organization_name
          );
          
          console.log('[DRE Check] API result:', result);
          
          if (result.exists && result.data_expirare) {
            console.log('[DRE Check] Setting expiration date:', result.data_expirare);
            // Pre-fill expiration date from existing DRE
            setFormData(prev => ({
              ...prev,
              data_expirare: result.data_expirare
            }));
          } else {
            console.log('[DRE Check] No existing DRE found');
          }
        } catch (error) {
          console.error('[DRE Check] Error checking examinator:', error);
        }
      }
    };

    // Debounce the check to avoid too many requests
    const timeoutId = setTimeout(checkExaminator, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.tip_declaratie, formData.nume_examinator, formData.organization_name]);

  const loadOrganizations = async () => {
    try {
      const users = await apiClient.getAllUsers();
      let orgs = users
        .filter(u => u.isf_name || u.cisf_name || u.scsc_name)
        .map(u => ({
          type: u.role,
          name: u.isf_name || u.cisf_name || u.scsc_name
        }))
        .filter((org, index, self) => 
          index === self.findIndex(o => o.name === org.name)
        )
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setOrganizations(orgs);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

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
    if (!formData.organization_name) { setError("ISF / CISF / SCSC este obligatoriu."); return; }
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
      formDataToSend.append('organization_name', formData.organization_name);
      formDataToSend.append('nume_examinator', formData.nume_examinator);
      formDataToSend.append('tip_declaratie', formData.tip_declaratie);
      formDataToSend.append('limba_evaluare', formData.limba_evaluare);
      formDataToSend.append('data_emitere', formData.data_emitere);
      formDataToSend.append('data_expirare', formData.data_expirare);
      formDataToSend.append('material_rulant_teoretic', formData.material_rulant_teoretic);
      formDataToSend.append('material_rulant_practic', formData.material_rulant_practic);
      formDataToSend.append('infrastructura_teoretic', formData.infrastructura_teoretic);
      formDataToSend.append('infrastructura_practic', formData.infrastructura_practic);
      
      // Append all attachment files
      attachments.forEach((file) => {
        formDataToSend.append('files', file);
      });
      
      await apiClient.createDre(formDataToSend);
      setSuccess(true);
      
      // Redirect based on user role and force reload
      const redirectPath = user.role === 'admin' || isFlorin ? '/all-dre' : '/my-dre';
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
        window.location.reload();
      }, 2000);
    } catch (error) {
      // Handle error with existingId for duplicate detection
      if (error.existingId) {
        setError({ message: error.message, existingId: error.existingId });
      } else {
        setError(error.message || 'Eroare la crearea DRE');
      }
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">
                {typeof error === 'object' ? error.message : error}
              </p>
            </div>
            {typeof error === 'object' && error.existingId && (
              <button
                type="button"
                onClick={() => {
                  const targetPage = user?.role === 'admin' || isFlorin ? '/all-dre' : '/my-dre';
                  navigate(targetPage, { state: { highlightId: error.existingId } });
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold underline"
              >
                Vezi DRE existent →
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* ISF/CISF/SCSC Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ISF / CISF / SCSC <span className="text-red-500">*</span>
            </label>
            {(isAdmin || isFlorin) ? (
              <select
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
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
                {formData.organization_name || (user?.isf_name || user?.cisf_name || user?.scsc_name) || 'Necunoscut'}
              </div>
            )}
          </div>

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
