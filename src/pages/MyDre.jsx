import { useState, useEffect } from "react";
import { FileStack, AlertCircle, Search, Filter, Download, ChevronUp, ChevronDown } from "lucide-react";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { format } from "date-fns";

const COLUMNS = [
  { label: "Nr. crt.", col: null },
  { label: "Nr. declarație", col: "nr_declaratie" },
  { label: "Nume și prenume examinator", col: "nume_examinator" },
  { label: "Tip declarație (nouă / reînnoită / modificată)", col: "tip_declaratie" },
  { label: "Limba de evaluare", col: "limba_evaluare" },
  { label: "Data emitere", col: "data_emitere" },
  { label: "Valabilitate", col: "data_expirare" },
];

export default function MyDre({ user }) {
  const [loading, setLoading] = useState(true);
  const [dreList, setDreList] = useState([]);
  const [search, setSearch] = useState("");
  const [filterTip, setFilterTip] = useState("");
  const [sortCol, setSortCol] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  // Filtering
  let filtered = dreList.filter((dre) => {
    if (search && !dre.nr_declaratie.toLowerCase().includes(search.toLowerCase()) &&
        !dre.nume_examinator.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterTip && dre.tip_declaratie !== filterTip) return false;
    return true;
  });

  // Sorting
  if (sortCol) {
    filtered.sort((a, b) => {
      let aVal = a[sortCol];
      let bVal = b[sortCol];
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedData = filtered.slice(startIdx, endIdx);

  const handleSort = (col) => {
    if (!col) return;
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const handleExport = () => {
    const headers = [
      "Nr. declarație",
      "Nume examinator",
      "Tip declarație",
      "Limba evaluare",
      "Material rulant teoretic",
      "Material rulant practic",
      "Infrastructură teoretic",
      "Infrastructură practic",
      "Data emitere",
      "Data expirare",
    ];
    const rows = filtered.map((d) => [
      d.nr_declaratie || "",
      d.nume_examinator || "",
      d.tip_declaratie || "",
      d.limba_evaluare || "",
      d.material_rulant_teoretic ? "Da" : "Nu",
      d.material_rulant_practic ? "Da" : "Nu",
      d.infrastructura_teoretic ? "Da" : "Nu",
      d.infrastructura_practic ? "Da" : "Nu",
      d.data_emitere ? formatDate(d.data_emitere) : "",
      d.data_expirare ? formatDate(d.data_expirare) : "",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dre-export-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => {
    if (!col || sortCol !== col) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-purple-500" /> : <ChevronDown className="w-3 h-3 text-purple-500" />;
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
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filtre</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Căutare</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nr. declarație sau examinator..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tip Declarație</label>
            <select
              value={filterTip}
              onChange={(e) => setFilterTip(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Toate tipurile</option>
              <option value="noua">Nouă</option>
              <option value="reinnoita">Reînnoită</option>
              <option value="modificata">Modificată</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rezultate per pagină</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
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
                    Tip<br/>declarație<br/>(nouă /<br/>reînnoită /<br/>modificată)
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
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                      Nu aveți DRE-uri în sistem
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((dre, index) => (
                    <tr key={dre.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-600">
                        {startIdx + index + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-900 font-medium">
                        {dre.nr_declaratie}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-900">
                        {dre.nume_examinator}
                      </td>
                      <td className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-600">
                        {dre.tip_declaratie === 'noua' ? 'nouă' : 
                         dre.tip_declaratie === 'reinnoita' ? 'reînnoită' : 'modificată'}
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
