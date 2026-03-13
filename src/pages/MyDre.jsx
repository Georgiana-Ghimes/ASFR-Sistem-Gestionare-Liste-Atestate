import { useState, useEffect } from "react";
import { FileStack, AlertCircle } from "lucide-react";
import { apiClient } from "../api/client";
import { toast } from "sonner";

export default function MyDre({ user }) {
  const [loading, setLoading] = useState(true);
  const [dreList, setDreList] = useState([]);

  const isRegularUser = ['isf', 'cisf', 'scsc'].includes(user?.role);
  const hasDreRole = user?.has_dre_role;

  useEffect(() => {
    if (isRegularUser && hasDreRole) {
      loadDreList();
    }
  }, [isRegularUser, hasDreRole]);

  const loadDreList = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyDre();
      setDreList(data);
    } catch (error) {
      console.error('Load my DRE error:', error);
      toast.error('Eroare la încărcarea DRE-urilor');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  if (!user || !isRegularUser || !hasDreRole) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">Acces neautorizat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileStack className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">DRE-urile mele</h1>
          </div>
          <p className="text-gray-500 text-sm">Vizualizare și gestionare DRE-uri proprii</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-500">Se încarcă...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                {/* Row 1 - Main headers */}
                <tr className="bg-gray-100">
                  <th rowSpan={3} className="border border-gray-300 px-3 py-3 text-center text-xs font-semibold text-gray-700">
                    Nr.<br/>crt.
                  </th>
                  <th rowSpan={3} className="border border-gray-300 px-3 py-3 text-center text-xs font-semibold text-gray-700">
                    Nr. declarație
                  </th>
                  <th rowSpan={3} className="border border-gray-300 px-3 py-3 text-center text-xs font-semibold text-gray-700">
                    Nume și prenume examinator
                  </th>
                  <th rowSpan={3} className="border border-gray-300 px-3 py-3 text-center text-xs font-semibold text-gray-700">
                    Tip<br/>declarație<br/>(nouă<br/>reînnoire<br/>modificată)
                  </th>
                  <th rowSpan={3} className="border border-gray-300 px-3 py-3 text-center text-xs font-semibold text-gray-700">
                    Limba de<br/>evaluare
                  </th>
                  <th colSpan={4} className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                    Domenii de competență examinator
                  </th>
                  <th rowSpan={3} className="border border-gray-300 px-3 py-3 text-center text-xs font-semibold text-gray-700">
                    Data<br/>emitere<br/>declarației
                  </th>
                  <th rowSpan={3} className="border border-gray-300 px-3 py-3 text-center text-xs font-semibold text-gray-700">
                    Valabilitate<br/>declarație*
                  </th>
                </tr>
                
                {/* Row 2 - Sub-categories */}
                <tr className="bg-gray-100">
                  <th colSpan={2} className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                    Cunoștințe profesionale<br/>de material rulant
                  </th>
                  <th colSpan={2} className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                    Cunoștințe profesionale<br/>de infrastructură
                  </th>
                </tr>
                
                {/* Row 3 - Evaluation types */}
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-center text-[10px] font-semibold text-gray-700">
                    Evaluare<br/>teoretică
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-[10px] font-semibold text-gray-700">
                    Evaluare<br/>practică
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-[10px] font-semibold text-gray-700">
                    Evaluare<br/>teoretică
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-[10px] font-semibold text-gray-700">
                    Evaluare<br/>practică
                  </th>
                </tr>
              </thead>
              <tbody>
                {dreList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                      Nu aveți DRE-uri în sistem
                    </td>
                  </tr>
                ) : (
                  dreList.map((dre, index) => (
                    <tr key={dre.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-900 font-medium">
                        {dre.nr_declaratie}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-900">
                        {dre.nume_examinator}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-600 capitalize">
                        {dre.tip_declaratie}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-600">
                        {dre.limba_evaluare}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm">
                        {dre.material_rulant_teoretic ? '✓' : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm">
                        {dre.material_rulant_practic ? '✓' : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm">
                        {dre.infrastructura_teoretic ? '✓' : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm">
                        {dre.infrastructura_practic ? '✓' : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-600">
                        {formatDate(dre.data_emitere)}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-600">
                        {formatDate(dre.data_expirare)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
