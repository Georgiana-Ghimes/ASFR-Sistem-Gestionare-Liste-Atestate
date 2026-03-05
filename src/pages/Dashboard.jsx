import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import StatsCard from "../components/StatsCard";
import { List, Clock, CheckCircle, Send, Calendar, FileText } from "lucide-react";
import { format, getMonth, getYear } from "date-fns";
import * as XLSX from 'xlsx';

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState(
    user?.email === 'cecilia.mihaila@sigurantaferoviara.ro' ? "atestate" : "liste"
  );
  const [lists, setLists] = useState([]);
  const [atestate, setAtestate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterISF, setFilterISF] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const listsData = await apiClient.getAllLists();
        setLists(listsData);
        
        // Load atestate if user has access
        if (user?.has_atestate_role || user?.role === 'admin') {
          try {
            const atestateData = await apiClient.getAllAtestate();
            setAtestate(atestateData);
          } catch (err) {
            console.error('Failed to load atestate:', err);
          }
        }
      } catch (error) {
        console.error('Failed to load lists:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // No restrictions - all authenticated users can see dashboard

  // Get all ISFs from lists and all organizations from atestate
  const allISFs = [...new Set(lists.map((l) => l.isf_name).filter(Boolean))].sort();
  const allOrgsFromAtestate = [...new Set(atestate.map((a) => a.organization_name).filter(Boolean))].sort();
  
  // Use appropriate list based on active tab
  const allOrganizations = activeTab === "liste" ? allISFs : allOrgsFromAtestate;
  
  const years = [...new Set(lists.map((l) => l.created_date ? String(new Date(l.created_date).getFullYear()) : null).filter(Boolean))].sort((a, b) => parseInt(b) - parseInt(a));
  if (!years.includes(filterYear)) years.unshift(filterYear);

  const nowMonth = parseInt(filterMonth);
  const nowYear = parseInt(filterYear);

  const filteredByStat = lists.filter((l) => {
    if (filterISF && l.isf_name !== filterISF) return false;
    return true;
  });

  const filteredByPeriod = lists.filter((l) => {
    if (filterISF && l.isf_name !== filterISF) return false;
    // Filter by trimis_at date instead of data_lista
    if (l.trimis_at) {
      const d = new Date(l.trimis_at);
      if (getMonth(d) + 1 !== nowMonth) return false;
      if (getYear(d) !== nowYear) return false;
    } else return false;
    return true;
  });

  // Filter atestate
  const filteredAtestateByStat = atestate.filter((a) => {
    if (filterISF && a.organization_name !== filterISF) return false;
    return true;
  });

  const filteredAtestateByPeriod = atestate.filter((a) => {
    if (filterISF && a.organization_name !== filterISF) return false;
    if (a.trimis_at) {
      const d = new Date(a.trimis_at);
      if (getMonth(d) + 1 !== nowMonth) return false;
      if (getYear(d) !== nowYear) return false;
    } else return false;
    return true;
  });

  const kpi = {
    total: filteredByStat.length,
    primita: filteredByStat.filter((l) => l.status === "PRIMITA").length,
    verificata: filteredByStat.filter((l) => l.status === "VERIFICATA").length,
    trimisa: filteredByStat.filter((l) => l.status === "TRIMISA").length,
    trimisaLuna: filteredByPeriod.filter((l) => l.status === "TRIMISA").length,
  };

  // KPI for atestate
  const atestateKpi = {
    total: filteredAtestateByStat.length,
    primita: filteredAtestateByStat.filter((a) => a.status === "PRIMITA").length,
    verificata: filteredAtestateByStat.filter((a) => a.status === "VERIFICATA").length,
    trimisa: filteredAtestateByStat.filter((a) => a.status === "TRIMISA").length,
    trimisaLuna: filteredAtestateByPeriod.filter((a) => a.status === "TRIMISA").length,
  };

  // Use appropriate KPI based on active tab
  const currentKpi = activeTab === "liste" ? kpi : atestateKpi;
  const kpiLabel = activeTab === "liste" ? "Liste" : "Atestate";

  const isfStats = allISFs
    .filter((isf) => !filterISF || isf === filterISF)
    .map((isf) => {
      const isfLists = filteredByStat.filter((l) => l.isf_name === isf);
      const isfListsLuna = filteredByPeriod.filter((l) => l.isf_name === isf);
      return {
        isf_name: isf,
        total: isfLists.length,
        primita: isfLists.filter((l) => l.status === "PRIMITA").length,
        verificata: isfLists.filter((l) => l.status === "VERIFICATA").length,
        trimisa: isfLists.filter((l) => l.status === "TRIMISA").length,
        trimisaLuna: isfListsLuna.filter((l) => l.status === "TRIMISA").length,
        totalAutorizatii: isfLists.filter((l) => l.tip === "Autorizatii").reduce((sum, l) => sum + (l.numar_autorizatii || 0), 0),
        totalVize: isfLists.filter((l) => l.tip === "Vize").reduce((sum, l) => sum + (l.numar_autorizatii || 0), 0),
        totalDuplicate: isfLists.filter((l) => l.tip === "Duplicate").reduce((sum, l) => sum + (l.numar_autorizatii || 0), 0),
        totalSchimbareNume: isfLists.filter((l) => l.tip === "Schimbare nume").reduce((sum, l) => sum + (l.numar_autorizatii || 0), 0),
      };
    });

  const months = [
    { v: "01", l: "Ianuarie" }, { v: "02", l: "Februarie" }, { v: "03", l: "Martie" },
    { v: "04", l: "Aprilie" }, { v: "05", l: "Mai" }, { v: "06", l: "Iunie" },
    { v: "07", l: "Iulie" }, { v: "08", l: "August" }, { v: "09", l: "Septembrie" },
    { v: "10", l: "Octombrie" }, { v: "11", l: "Noiembrie" }, { v: "12", l: "Decembrie" },
  ];

  const atestateStats = allOrgsFromAtestate
    .filter((org) => !filterISF || org === filterISF)
    .map((org) => {
      const orgAtestate = filteredAtestateByStat.filter((a) => a.organization_name === org);
      const orgAtestateLuna = filteredAtestateByPeriod.filter((a) => a.organization_name === org);
      return {
        organization_name: org,
        total: orgAtestate.length,
        primita: orgAtestate.filter((a) => a.status === "PRIMITA").length,
        verificata: orgAtestate.filter((a) => a.status === "VERIFICATA").length,
        trimisa: orgAtestate.filter((a) => a.status === "TRIMISA").length,
        trimisaLuna: orgAtestateLuna.filter((a) => a.status === "TRIMISA").length
      };
    });

  const handleGenerateListeReport = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthName = months.find(m => m.v === String(currentMonth).padStart(2, "0"))?.l;
    
    // Filter lists for current month
    const currentMonthLists = lists.filter((l) => {
      if (l.created_date) {
        const d = new Date(l.created_date);
        return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
      }
      return false;
    });

    const primiteCurrentMonth = currentMonthLists.filter((l) => l.status === "PRIMITA").length;
    const verificateCurrentMonth = currentMonthLists.filter((l) => l.status === "VERIFICATA").length;
    const trimiseCurrentMonth = currentMonthLists.filter((l) => l.status === "TRIMISA").length;

    // Calculate totals by tip
    const totalAutorizatii = currentMonthLists.filter((l) => l.tip === "Autorizatii").length;
    const totalVize = currentMonthLists.filter((l) => l.tip === "Vize").length;
    const totalDuplicate = currentMonthLists.filter((l) => l.tip === "Duplicate").length;
    const totalSchimbareNume = currentMonthLists.filter((l) => l.tip === "Schimbare nume").length;

    // Filter lists sent in current month
    const trimiseInLuna = lists.filter((l) => {
      if (l.trimis_at) {
        const d = new Date(l.trimis_at);
        return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
      }
      return false;
    }).length;

    const headers = ["Indicator", "Valoare"];
    const rows = [
      ["Total Liste", currentMonthLists.length],
      ["Total Autorizații", totalAutorizatii],
      ["Total Vize", totalVize],
      ["Total Duplicate", totalDuplicate],
      ["Total Schimbare nume", totalSchimbareNume],
      ["Primite", primiteCurrentMonth],
      ["Verificate", verificateCurrentMonth],
      ["Trimise", trimiseCurrentMonth],
      [`Trimise ${monthName}`, trimiseInLuna],
      ["", ""],
      ["Generat la", format(new Date(), "dd.MM.yyyy HH:mm")]
    ];

    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raport-liste-${monthName.toLowerCase()}-${currentYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateAtestateReport = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthName = months.find(m => m.v === String(currentMonth).padStart(2, "0"))?.l;
    
    // Filter atestate for current month
    const currentMonthAtestate = atestate.filter((a) => {
      if (a.created_date) {
        const d = new Date(a.created_date);
        return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
      }
      return false;
    });

    const primiteCurrentMonth = currentMonthAtestate.filter((a) => a.status === "PRIMITA").length;
    const verificateCurrentMonth = currentMonthAtestate.filter((a) => a.status === "VERIFICATA").length;
    const trimiseCurrentMonth = currentMonthAtestate.filter((a) => a.status === "TRIMISA").length;

    const headers = ["Indicator", "Valoare"];
    const rows = [
      ["Total Atestate", currentMonthAtestate.length],
      ["Atestate Primite", primiteCurrentMonth],
      ["Atestate Verificate", verificateCurrentMonth],
      ["Atestate Trimise", trimiseCurrentMonth],
      ["", ""],
      ["Generat la", format(new Date(), "dd.MM.yyyy HH:mm")]
    ];

    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raport-atestate-${monthName.toLowerCase()}-${currentYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateListeYearReport = () => {
    const currentYear = new Date().getFullYear();
    const workbook = XLSX.utils.book_new();

    // Create a sheet for each month
    months.forEach((month) => {
      const monthNum = parseInt(month.v);
      const monthLists = lists.filter((l) => {
        if (l.created_date) {
          const d = new Date(l.created_date);
          return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
        }
        return false;
      });

      const trimiseInLuna = lists.filter((l) => {
        if (l.trimis_at) {
          const d = new Date(l.trimis_at);
          return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
        }
        return false;
      }).length;

      const totalAutorizatii = monthLists.filter((l) => l.tip === "Autorizatii").length;
      const totalVize = monthLists.filter((l) => l.tip === "Vize").length;
      const totalDuplicate = monthLists.filter((l) => l.tip === "Duplicate").length;
      const totalSchimbareNume = monthLists.filter((l) => l.tip === "Schimbare nume").length;

      const data = [
        ["Indicator", "Valoare"],
        ["Total Liste", monthLists.length],
        ["Total Autorizații", totalAutorizatii],
        ["Total Vize", totalVize],
        ["Total Duplicate", totalDuplicate],
        ["Total Schimbare nume", totalSchimbareNume],
        ["Primite", monthLists.filter((l) => l.status === "PRIMITA").length],
        ["Verificate", monthLists.filter((l) => l.status === "VERIFICATA").length],
        ["Trimise", monthLists.filter((l) => l.status === "TRIMISA").length],
        [`Trimise ${month.l}`, trimiseInLuna]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, month.l);
    });

    // Create total year sheet
    const yearLists = lists.filter((l) => {
      if (l.created_date) {
        const d = new Date(l.created_date);
        return getYear(d) === currentYear;
      }
      return false;
    });

    const trimiseInAn = lists.filter((l) => {
      if (l.trimis_at) {
        const d = new Date(l.trimis_at);
        return getYear(d) === currentYear;
      }
      return false;
    }).length;

    const totalAutorizatiiAn = yearLists.filter((l) => l.tip === "Autorizatii").length;
    const totalVizeAn = yearLists.filter((l) => l.tip === "Vize").length;
    const totalDuplicateAn = yearLists.filter((l) => l.tip === "Duplicate").length;
    const totalSchimbareNumeAn = yearLists.filter((l) => l.tip === "Schimbare nume").length;

    const yearData = [
      ["Indicator", "Valoare"],
      ["Total Liste", yearLists.length],
      ["Total Autorizații", totalAutorizatiiAn],
      ["Total Vize", totalVizeAn],
      ["Total Duplicate", totalDuplicateAn],
      ["Total Schimbare nume", totalSchimbareNumeAn],
      ["Primite", yearLists.filter((l) => l.status === "PRIMITA").length],
      ["Verificate", yearLists.filter((l) => l.status === "VERIFICATA").length],
      ["Trimise", yearLists.filter((l) => l.status === "TRIMISA").length],
      [`Trimise ${currentYear}`, trimiseInAn],
      ["", ""],
      ["Generat la", format(new Date(), "dd.MM.yyyy HH:mm")]
    ];

    const yearWorksheet = XLSX.utils.aoa_to_sheet(yearData);
    XLSX.utils.book_append_sheet(workbook, yearWorksheet, `Total ${currentYear}`);

    // Download the file
    XLSX.writeFile(workbook, `raport-liste-${currentYear}.xlsx`);
  };

  const handleGenerateAtestateYearReport = () => {
    const currentYear = new Date().getFullYear();
    const workbook = XLSX.utils.book_new();

    // Create a sheet for each month
    months.forEach((month) => {
      const monthNum = parseInt(month.v);
      const monthAtestate = atestate.filter((a) => {
        if (a.created_date) {
          const d = new Date(a.created_date);
          return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
        }
        return false;
      });

      const trimiseInLuna = atestate.filter((a) => {
        if (a.trimis_at) {
          const d = new Date(a.trimis_at);
          return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
        }
        return false;
      }).length;

      const data = [
        ["Indicator", "Valoare"],
        ["Total Atestate", monthAtestate.length],
        ["Primite", monthAtestate.filter((a) => a.status === "PRIMITA").length],
        ["Verificate", monthAtestate.filter((a) => a.status === "VERIFICATA").length],
        ["Trimise", monthAtestate.filter((a) => a.status === "TRIMISA").length],
        [`Trimise ${month.l}`, trimiseInLuna]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, month.l);
    });

    // Create total year sheet
    const yearAtestate = atestate.filter((a) => {
      if (a.created_date) {
        const d = new Date(a.created_date);
        return getYear(d) === currentYear;
      }
      return false;
    });

    const trimiseInAn = atestate.filter((a) => {
      if (a.trimis_at) {
        const d = new Date(a.trimis_at);
        return getYear(d) === currentYear;
      }
      return false;
    }).length;

    const yearData = [
      ["Indicator", "Valoare"],
      ["Total Atestate", yearAtestate.length],
      ["Primite", yearAtestate.filter((a) => a.status === "PRIMITA").length],
      ["Verificate", yearAtestate.filter((a) => a.status === "VERIFICATA").length],
      ["Trimise", yearAtestate.filter((a) => a.status === "TRIMISA").length],
      [`Trimise ${currentYear}`, trimiseInAn],
      ["", ""],
      ["Generat la", format(new Date(), "dd.MM.yyyy HH:mm")]
    ];

    const yearWorksheet = XLSX.utils.aoa_to_sheet(yearData);
    XLSX.utils.book_append_sheet(workbook, yearWorksheet, `Total ${currentYear}`);

    // Download the file
    XLSX.writeFile(workbook, `raport-atestate-${currentYear}.xlsx`);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Statistici</h1>
        <p className="text-gray-500 mt-1 text-sm">Statistici generale privind listele de tipărire autorizații și atestatele.</p>
      </div>

      {/* Period filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Lună</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m) => (
                <option key={m.v} value={m.v}>{m.l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">An</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">ISF / CISF / SCSC</label>
            <select
              value={filterISF}
              onChange={(e) => setFilterISF(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toate ISF-urile</option>
              {allOrganizations.map((org) => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatsCard title={`Total ${kpiLabel}`} value={currentKpi.total} icon={List} color="slate" />
            <StatsCard title="PRIMITE" value={currentKpi.primita} icon={Clock} color="amber" />
            <StatsCard title="VERIFICATE" value={currentKpi.verificata} icon={CheckCircle} color="blue" />
            <StatsCard title="TRIMISE" value={currentKpi.trimisa} icon={Send} color="emerald" />
            <StatsCard title={`Trimise ${months.find(m => m.v === filterMonth)?.l} ${filterYear}`} value={currentKpi.trimisaLuna} icon={Calendar} color="violet" />
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {user?.email !== 'cecilia.mihaila@sigurantaferoviara.ro' && (
                  <button
                    onClick={() => setActiveTab("liste")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "liste"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Statistici Liste
                  </button>
                )}
                {(user?.has_atestate_role || user?.role === 'admin') && user?.email !== 'daniel.bulearca@sigurantaferoviara.ro' && (
                  <button
                    onClick={() => setActiveTab("atestate")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "atestate"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Statistici Atestate
                  </button>
                )}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "liste" ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Statistici Liste per ISF / CISF / SCSC</h2>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateListeReport}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      Generează Raport Luna Curentă
                    </button>
                    <button
                      onClick={handleGenerateListeYearReport}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Generează Raport Anul Curent
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["ISF / CISF / SCSC", "Total Liste", "Total Autorizații", "Total Vize", "Total Duplicate", "Total Schimbare nume", "PRIMITE", "VERIFICATE", "TRIMISE", `Trimise ${months.find(m => m.v === filterMonth)?.l}`].map((h) => (
                        <th key={h} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isfStats.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-400 text-sm">
                          Nu există date disponibile.
                        </td>
                      </tr>
                    ) : (
                      isfStats.map((row) => (
                        <tr key={row.isf_name} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">{row.isf_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.total}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.totalAutorizatii}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.totalVize}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.totalDuplicate}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.totalSchimbareNume}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              {row.primita}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {row.verificata}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              {row.trimisa}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800">
                              {row.trimisaLuna}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Statistici Atestate per ISF / CISF / SCSC</h2>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateAtestateReport}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      Generează Raport Luna Curentă
                    </button>
                    <button
                      onClick={handleGenerateAtestateYearReport}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Generează Raport Anul Curent
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["ISF / CISF / SCSC", "Total Atestate", "PRIMITE", "VERIFICATE", "TRIMISE", `Trimise ${months.find(m => m.v === filterMonth)?.l}`].map((h) => (
                        <th key={h} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {atestateStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                          Nu există date disponibile.
                        </td>
                      </tr>
                    ) : (
                      atestateStats.map((row) => (
                        <tr key={row.organization_name} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">{row.organization_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.total}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              {row.primita}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {row.verificata}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              {row.trimisa}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800">
                              {row.trimisaLuna}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
