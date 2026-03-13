import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import StatsCard from "../components/StatsCard";
import { List, Clock, CheckCircle, Send, Calendar, FileText, LayoutDashboard } from "lucide-react";
import { format, getMonth, getYear } from "date-fns";
import * as XLSX from 'xlsx-js-style';

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState(
    user?.email === 'cecilia.mihaila@sigurantaferoviara.ro' || user?.email === 'alexandra.stefan@sigurantaferoviara.ro'
      ? "atestate" 
      : user?.email === 'florin.hritcu@sigurantaferoviara.ro'
        ? "dre"
        : "liste"
  );
  const [lists, setLists] = useState([]);
  const [atestate, setAtestate] = useState([]);
  const [dre, setDre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  
  // Auto-filter by user's organization if not admin/florin
  const getUserOrganization = () => {
    if (user?.role === 'admin' || user?.email === 'florin.hritcu@sigurantaferoviara.ro') {
      return "";
    }
    return user?.isf_name || user?.cisf_name || user?.scsc_name || "";
  };
  
  const [filterISF, setFilterISF] = useState(getUserOrganization());

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
        
        // Load DRE if user has access
        if (user?.has_dre_role || user?.role === 'admin' || user?.email === 'florin.hritcu@sigurantaferoviara.ro') {
          try {
            const dreData = await apiClient.getAllDre();
            setDre(dreData);
          } catch (err) {
            console.error('Failed to load DRE:', err);
          }
        }
      } catch (error) {
        console.error('Failed to load lists:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
    
    // Update filter when user changes
    setFilterISF(getUserOrganization());
  }, [user]);

  // No restrictions - all authenticated users can see dashboard

  // Get all ISFs from lists and all organizations from atestate
  const allISFs = [...new Set(lists.map((l) => l.isf_name).filter(Boolean))].sort();
  const allOrgsFromAtestate = [...new Set(atestate.map((a) => a.organization_name).filter(Boolean))].sort();
  const allOrgsFromDre = [...new Set(dre.map((d) => d.organization_name).filter(Boolean))].sort();
  
  // Use appropriate list based on active tab
  const allOrganizations = activeTab === "liste" ? allISFs : activeTab === "atestate" ? allOrgsFromAtestate : allOrgsFromDre;
  
  const years = [...new Set(lists.map((l) => l.created_date ? String(new Date(l.created_date).getFullYear()) : null).filter(Boolean))].sort((a, b) => parseInt(b) - parseInt(a));
  if (!years.includes(filterYear)) years.unshift(filterYear);

  const nowMonth = parseInt(filterMonth);
  const nowYear = parseInt(filterYear);

  const filteredByStat = lists.filter((l) => {
    if (filterISF && l.isf_name !== filterISF) return false;
    // Filter by created_date for selected month/year
    if (l.created_date) {
      const d = new Date(l.created_date);
      if (getMonth(d) + 1 !== nowMonth) return false;
      if (getYear(d) !== nowYear) return false;
    } else return false;
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
    // Filter by created_date for selected month/year
    if (a.created_date) {
      const d = new Date(a.created_date);
      if (getMonth(d) + 1 !== nowMonth) return false;
      if (getYear(d) !== nowYear) return false;
    } else return false;
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

  // Filter DRE
  const filteredDreByStat = dre.filter((d) => {
    if (filterISF && d.organization_name !== filterISF) return false;
    // Filter by created_at for selected month/year
    if (d.created_at) {
      const dt = new Date(d.created_at);
      if (getMonth(dt) + 1 !== nowMonth) return false;
      if (getYear(dt) !== nowYear) return false;
    } else return false;
    return true;
  });

  // KPI for DRE
  const dreKpi = {
    total: filteredDreByStat.length,
    nou: filteredDreByStat.filter((d) => d.tip_declaratie === "NOU").length,
    reinnoit: filteredDreByStat.filter((d) => d.tip_declaratie === "REINNOIT").length,
    modificat: filteredDreByStat.filter((d) => d.tip_declaratie === "MODIFICAT").length,
  };

  // Use appropriate KPI based on active tab
  const currentKpi = activeTab === "liste" ? kpi : activeTab === "atestate" ? atestateKpi : dreKpi;
  const kpiLabel = activeTab === "liste" ? "Liste" : activeTab === "atestate" ? "Atestate" : "DRE";

  const isfStats = allISFs
    .filter((isf) => !filterISF || isf === filterISF)
    .map((isf) => {
      // Filter lists by ISF and by selected month/year
      const isfListsByPeriod = lists.filter((l) => {
        if (l.isf_name !== isf) return false;
        if (l.created_date) {
          const d = new Date(l.created_date);
          if (getMonth(d) + 1 !== nowMonth) return false;
          if (getYear(d) !== nowYear) return false;
        } else return false;
        return true;
      });
      const isfListsLuna = filteredByPeriod.filter((l) => l.isf_name === isf);
      return {
        isf_name: isf,
        total: isfListsByPeriod.length,
        primita: isfListsByPeriod.filter((l) => l.status === "PRIMITA").length,
        verificata: isfListsByPeriod.filter((l) => l.status === "VERIFICATA").length,
        trimisa: isfListsByPeriod.filter((l) => l.status === "TRIMISA").length,
        trimisaLuna: isfListsLuna.filter((l) => l.status === "TRIMISA").length,
        totalAutorizatii: isfListsByPeriod.filter((l) => l.tip === "Autorizatii").reduce((sum, l) => sum + (l.numar_autorizatii || 0), 0),
        totalVize: isfListsByPeriod.filter((l) => l.tip === "Vize").reduce((sum, l) => sum + (l.numar_autorizatii || 0), 0),
        totalDuplicate: isfListsByPeriod.filter((l) => l.tip === "Duplicate").reduce((sum, l) => sum + (l.numar_autorizatii || 0), 0),
        totalSchimbareNume: isfListsByPeriod.filter((l) => l.tip === "Schimbare nume").reduce((sum, l) => sum + (l.numar_autorizatii || 0), 0),
      };
    })
    .filter((stat) => stat.total > 0); // Only show ISFs that have lists in the selected period

  const months = [
    { v: "01", l: "Ianuarie" }, { v: "02", l: "Februarie" }, { v: "03", l: "Martie" },
    { v: "04", l: "Aprilie" }, { v: "05", l: "Mai" }, { v: "06", l: "Iunie" },
    { v: "07", l: "Iulie" }, { v: "08", l: "August" }, { v: "09", l: "Septembrie" },
    { v: "10", l: "Octombrie" }, { v: "11", l: "Noiembrie" }, { v: "12", l: "Decembrie" },
  ];

  const atestateStats = allOrgsFromAtestate
    .filter((org) => !filterISF || org === filterISF)
    .map((org) => {
      // Filter atestate by organization and by selected month/year
      const orgAtestateByPeriod = atestate.filter((a) => {
        if (a.organization_name !== org) return false;
        if (a.created_date) {
          const d = new Date(a.created_date);
          if (getMonth(d) + 1 !== nowMonth) return false;
          if (getYear(d) !== nowYear) return false;
        } else return false;
        return true;
      });
      const orgAtestateLuna = filteredAtestateByPeriod.filter((a) => a.organization_name === org);
      return {
        organization_name: org,
        total: orgAtestateByPeriod.length,
        primita: orgAtestateByPeriod.filter((a) => a.status === "PRIMITA").length,
        verificata: orgAtestateByPeriod.filter((a) => a.status === "VERIFICATA").length,
        trimisa: orgAtestateByPeriod.filter((a) => a.status === "TRIMISA").length,
        trimisaLuna: orgAtestateLuna.filter((a) => a.status === "TRIMISA").length
      };
    })
    .filter((stat) => stat.total > 0); // Only show organizations that have atestate in the selected period

  // DRE Stats per organization
  const dreStats = allOrgsFromDre
    .filter((org) => !filterISF || org === filterISF)
    .map((org) => {
      // Filter DRE by organization and by selected month/year
      const orgDreByPeriod = dre.filter((d) => {
        if (d.organization_name !== org) return false;
        if (d.created_at) {
          const dt = new Date(d.created_at);
          if (getMonth(dt) + 1 !== nowMonth) return false;
          if (getYear(dt) !== nowYear) return false;
        } else return false;
        return true;
      });
      return {
        organization_name: org,
        total: orgDreByPeriod.length,
        nou: orgDreByPeriod.filter((d) => d.tip_declaratie === "NOU").length,
        reinnoit: orgDreByPeriod.filter((d) => d.tip_declaratie === "REINNOIT").length,
        modificat: orgDreByPeriod.filter((d) => d.tip_declaratie === "MODIFICAT").length
      };
    })
    .filter((stat) => stat.total > 0); // Only show organizations that have DRE in the selected period

  const handleGenerateListeReport = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthName = months.find(m => m.v === String(currentMonth).padStart(2, "0"))?.l;
    
    const workbook = XLSX.utils.book_new();

    // Get ISFs that have activity in current month
    const activeISFs = allISFs.filter(isf => {
      return lists.some(l => {
        if (l.isf_name !== isf) return false;
        if (l.created_date) {
          const d = new Date(l.created_date);
          return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
        }
        return false;
      });
    });

    if (activeISFs.length === 0) {
      // Create empty sheet if no data
      const worksheet = XLSX.utils.aoa_to_sheet([["Nu există date pentru această lună"]]);
      XLSX.utils.book_append_sheet(workbook, worksheet, monthName);
      XLSX.writeFile(workbook, `raport-liste-${monthName.toLowerCase()}-${currentYear}.xlsx`);
      return;
    }

    // Build data horizontally - each ISF is a column block
    const indicators = [
      "Total Liste",
      "Total Autorizații",
      "Total Vize",
      "Total Duplicate",
      "Total Schimbare nume",
      "Primite",
      "Verificate",
      `Trimise ${monthName}`
    ];

    const data = [];
    
    // First row: ISF names
    const headerRow = [];
    activeISFs.forEach((isf, index) => {
      headerRow.push(isf);
      if (index < activeISFs.length - 1) {
        headerRow.push(""); // Empty column between blocks
      }
    });
    data.push(headerRow);

    // Data rows: one row per indicator
    indicators.forEach((indicator, indicatorIndex) => {
      const row = [];
      activeISFs.forEach((isf, isfIndex) => {
        const isfLists = lists.filter((l) => {
          if (l.isf_name !== isf) return false;
          if (l.created_date) {
            const d = new Date(l.created_date);
            return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
          }
          return false;
        });

        let value = 0;
        if (indicatorIndex === 0) value = isfLists.length;
        else if (indicatorIndex === 1) value = isfLists.filter(l => l.tip === "Autorizatii").length;
        else if (indicatorIndex === 2) value = isfLists.filter(l => l.tip === "Vize").length;
        else if (indicatorIndex === 3) value = isfLists.filter(l => l.tip === "Duplicate").length;
        else if (indicatorIndex === 4) value = isfLists.filter(l => l.tip === "Schimbare nume").length;
        else if (indicatorIndex === 5) value = isfLists.filter(l => l.status === "PRIMITA").length;
        else if (indicatorIndex === 6) value = isfLists.filter(l => l.status === "VERIFICATA").length;
        else if (indicatorIndex === 7) {
          value = lists.filter((l) => {
            if (l.isf_name !== isf) return false;
            if (l.trimis_at) {
              const d = new Date(l.trimis_at);
              return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
            }
            return false;
          }).length;
        }

        row.push(`${indicator}: ${value}`);
        if (isfIndex < activeISFs.length - 1) {
          row.push(""); // Empty column between blocks
        }
      });
      data.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Apply borders to each ISF block
    activeISFs.forEach((isf, isfIndex) => {
      const colIndex = isfIndex * 2; // Each block is 2 columns apart (1 data + 1 empty)
      
      // Apply border around the entire block (header + 8 data rows)
      for (let R = 0; R <= 8; R++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
        
        worksheet[cellAddress].s = {
          border: {
            top: R === 0 ? { style: 'thin', color: { rgb: "000000" } } : undefined,
            bottom: (R === 0 || R === 8) ? { style: 'thin', color: { rgb: "000000" } } : undefined,
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          },
          font: R === 0 ? { bold: true } : undefined
        };
      }
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, monthName);
    XLSX.writeFile(workbook, `raport-liste-${monthName.toLowerCase()}-${currentYear}.xlsx`);
  };

  const handleGenerateAtestateReport = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthName = months.find(m => m.v === String(currentMonth).padStart(2, "0"))?.l;
    
    const workbook = XLSX.utils.book_new();

    // Get organizations that have activity in current month
    const activeOrgs = allOrgsFromAtestate.filter(org => {
      return atestate.some(a => {
        if (a.organization_name !== org) return false;
        if (a.created_date) {
          const d = new Date(a.created_date);
          return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
        }
        return false;
      });
    });

    if (activeOrgs.length === 0) {
      const worksheet = XLSX.utils.aoa_to_sheet([["Nu există date pentru această lună"]]);
      XLSX.utils.book_append_sheet(workbook, worksheet, monthName);
      XLSX.writeFile(workbook, `raport-atestate-${monthName.toLowerCase()}-${currentYear}.xlsx`);
      return;
    }

    const indicators = [
      "Total Atestate",
      "Primite",
      "Verificate",
      `Trimise ${monthName}`
    ];

    const data = [];
    
    // First row: Organization names
    const headerRow = [];
    activeOrgs.forEach((org, index) => {
      headerRow.push(org);
      if (index < activeOrgs.length - 1) {
        headerRow.push("");
      }
    });
    data.push(headerRow);

    // Data rows
    indicators.forEach((indicator, indicatorIndex) => {
      const row = [];
      activeOrgs.forEach((org, orgIndex) => {
        const orgAtestate = atestate.filter((a) => {
          if (a.organization_name !== org) return false;
          if (a.created_date) {
            const d = new Date(a.created_date);
            return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
          }
          return false;
        });

        let value = 0;
        if (indicatorIndex === 0) value = orgAtestate.length;
        else if (indicatorIndex === 1) value = orgAtestate.filter(a => a.status === "PRIMITA").length;
        else if (indicatorIndex === 2) value = orgAtestate.filter(a => a.status === "VERIFICATA").length;
        else if (indicatorIndex === 3) {
          value = atestate.filter((a) => {
            if (a.organization_name !== org) return false;
            if (a.trimis_at) {
              const d = new Date(a.trimis_at);
              return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
            }
            return false;
          }).length;
        }

        row.push(`${indicator}: ${value}`);
        if (orgIndex < activeOrgs.length - 1) {
          row.push("");
        }
      });
      data.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Apply borders
    activeOrgs.forEach((org, orgIndex) => {
      const colIndex = orgIndex * 2;
      
      for (let R = 0; R <= 5; R++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
        
        worksheet[cellAddress].s = {
          border: {
            top: R === 0 ? { style: 'thin', color: { rgb: "000000" } } : undefined,
            bottom: (R === 0 || R === 5) ? { style: 'thin', color: { rgb: "000000" } } : undefined,
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          },
          font: R === 0 ? { bold: true } : undefined
        };
      }
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, monthName);
    XLSX.writeFile(workbook, `raport-atestate-${monthName.toLowerCase()}-${currentYear}.xlsx`);
  };

  const handleGenerateListeYearReport = () => {
    const currentYear = new Date().getFullYear();
    const workbook = XLSX.utils.book_new();

    // Create a sheet for each month
    months.forEach((month) => {
      const monthNum = parseInt(month.v);

      // Get ISFs that have activity in this month
      const activeISFs = allISFs.filter(isf => {
        return lists.some(l => {
          if (l.isf_name !== isf) return false;
          if (l.created_date) {
            const d = new Date(l.created_date);
            return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
          }
          return false;
        });
      });

      if (activeISFs.length === 0) {
        const worksheet = XLSX.utils.aoa_to_sheet([["Nu există date pentru această lună"]]);
        XLSX.utils.book_append_sheet(workbook, worksheet, month.l);
        return;
      }

      const indicators = [
        "Total Liste",
        "Total Autorizații",
        "Total Vize",
        "Total Duplicate",
        "Total Schimbare nume",
        "Primite",
        "Verificate",
        `Trimise ${month.l}`
      ];

      const data = [];
      
      // Header row
      const headerRow = [];
      activeISFs.forEach((isf, index) => {
        headerRow.push(isf);
        if (index < activeISFs.length - 1) headerRow.push("");
      });
      data.push(headerRow);

      // Data rows
      indicators.forEach((indicator, indicatorIndex) => {
        const row = [];
        activeISFs.forEach((isf, isfIndex) => {
          const isfLists = lists.filter((l) => {
            if (l.isf_name !== isf) return false;
            if (l.created_date) {
              const d = new Date(l.created_date);
              return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
            }
            return false;
          });

          let value = 0;
          if (indicatorIndex === 0) value = isfLists.length;
          else if (indicatorIndex === 1) value = isfLists.filter(l => l.tip === "Autorizatii").length;
          else if (indicatorIndex === 2) value = isfLists.filter(l => l.tip === "Vize").length;
          else if (indicatorIndex === 3) value = isfLists.filter(l => l.tip === "Duplicate").length;
          else if (indicatorIndex === 4) value = isfLists.filter(l => l.tip === "Schimbare nume").length;
          else if (indicatorIndex === 5) value = isfLists.filter(l => l.status === "PRIMITA").length;
          else if (indicatorIndex === 6) value = isfLists.filter(l => l.status === "VERIFICATA").length;
          else if (indicatorIndex === 7) {
            value = lists.filter((l) => {
              if (l.isf_name !== isf) return false;
              if (l.trimis_at) {
                const d = new Date(l.trimis_at);
                return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
              }
              return false;
            }).length;
          }

          row.push(`${indicator}: ${value}`);
          if (isfIndex < activeISFs.length - 1) row.push("");
        });
        data.push(row);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(data);

      // Apply borders
      activeISFs.forEach((isf, isfIndex) => {
        const colIndex = isfIndex * 2;
        for (let R = 0; R <= 8; R++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: colIndex });
          if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
          
          worksheet[cellAddress].s = {
            border: {
              top: R === 0 ? { style: 'thin', color: { rgb: "000000" } } : undefined,
              bottom: (R === 0 || R === 8) ? { style: 'thin', color: { rgb: "000000" } } : undefined,
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            },
            font: R === 0 ? { bold: true } : undefined
          };
        }
      });

      XLSX.utils.book_append_sheet(workbook, worksheet, month.l);
    });

    // Create total year sheet
    const activeISFsYear = allISFs.filter(isf => {
      return lists.some(l => {
        if (l.isf_name !== isf) return false;
        if (l.created_date) {
          const d = new Date(l.created_date);
          return getYear(d) === currentYear;
        }
        return false;
      });
    });

    if (activeISFsYear.length > 0) {
      const indicators = [
        "Total Liste",
        "Total Autorizații",
        "Total Vize",
        "Total Duplicate",
        "Total Schimbare nume",
        "Primite",
        "Verificate",
        `Trimise ${currentYear}`
      ];

      const yearData = [];
      
      const headerRow = [];
      activeISFsYear.forEach((isf, index) => {
        headerRow.push(isf);
        if (index < activeISFsYear.length - 1) headerRow.push("");
      });
      yearData.push(headerRow);

      indicators.forEach((indicator, indicatorIndex) => {
        const row = [];
        activeISFsYear.forEach((isf, isfIndex) => {
          const isfLists = lists.filter((l) => {
            if (l.isf_name !== isf) return false;
            if (l.created_date) {
              const d = new Date(l.created_date);
              return getYear(d) === currentYear;
            }
            return false;
          });

          let value = 0;
          if (indicatorIndex === 0) value = isfLists.length;
          else if (indicatorIndex === 1) value = isfLists.filter(l => l.tip === "Autorizatii").length;
          else if (indicatorIndex === 2) value = isfLists.filter(l => l.tip === "Vize").length;
          else if (indicatorIndex === 3) value = isfLists.filter(l => l.tip === "Duplicate").length;
          else if (indicatorIndex === 4) value = isfLists.filter(l => l.tip === "Schimbare nume").length;
          else if (indicatorIndex === 5) value = isfLists.filter(l => l.status === "PRIMITA").length;
          else if (indicatorIndex === 6) value = isfLists.filter(l => l.status === "VERIFICATA").length;
          else if (indicatorIndex === 7) {
            value = lists.filter((l) => {
              if (l.isf_name !== isf) return false;
              if (l.trimis_at) {
                const d = new Date(l.trimis_at);
                return getYear(d) === currentYear;
              }
              return false;
            }).length;
          }

          row.push(`${indicator}: ${value}`);
          if (isfIndex < activeISFsYear.length - 1) row.push("");
        });
        yearData.push(row);
      });

      const yearWorksheet = XLSX.utils.aoa_to_sheet(yearData);

      activeISFsYear.forEach((isf, isfIndex) => {
        const colIndex = isfIndex * 2;
        for (let R = 0; R <= 8; R++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: colIndex });
          if (!yearWorksheet[cellAddress]) yearWorksheet[cellAddress] = { t: 's', v: '' };
          
          yearWorksheet[cellAddress].s = {
            border: {
              top: R === 0 ? { style: 'thin', color: { rgb: "000000" } } : undefined,
            bottom: (R === 0 || R === 8) ? { style: 'thin', color: { rgb: "000000" } } : undefined,
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            },
            font: R === 0 ? { bold: true } : undefined
          };
        }
      });

      XLSX.utils.book_append_sheet(workbook, yearWorksheet, `Total ${currentYear}`);
    }

    XLSX.writeFile(workbook, `raport-liste-${currentYear}.xlsx`);
  };

  const handleGenerateAtestateYearReport = () => {
    const currentYear = new Date().getFullYear();
    const workbook = XLSX.utils.book_new();

    // Create a sheet for each month
    months.forEach((month) => {
      const monthNum = parseInt(month.v);

      // Get organizations that have activity in this month
      const activeOrgs = allOrgsFromAtestate.filter(org => {
        return atestate.some(a => {
          if (a.organization_name !== org) return false;
          if (a.created_date) {
            const d = new Date(a.created_date);
            return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
          }
          return false;
        });
      });

      if (activeOrgs.length === 0) {
        const worksheet = XLSX.utils.aoa_to_sheet([["Nu există date pentru această lună"]]);
        XLSX.utils.book_append_sheet(workbook, worksheet, month.l);
        return;
      }

      const indicators = [
        "Total Atestate",
        "Primite",
        "Verificate",
        `Trimise ${month.l}`
      ];

      const data = [];
      
      const headerRow = [];
      activeOrgs.forEach((org, index) => {
        headerRow.push(org);
        if (index < activeOrgs.length - 1) headerRow.push("");
      });
      data.push(headerRow);

      indicators.forEach((indicator, indicatorIndex) => {
        const row = [];
        activeOrgs.forEach((org, orgIndex) => {
          const orgAtestate = atestate.filter((a) => {
            if (a.organization_name !== org) return false;
            if (a.created_date) {
              const d = new Date(a.created_date);
              return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
            }
            return false;
          });

          let value = 0;
          if (indicatorIndex === 0) value = orgAtestate.length;
          else if (indicatorIndex === 1) value = orgAtestate.filter(a => a.status === "PRIMITA").length;
          else if (indicatorIndex === 2) value = orgAtestate.filter(a => a.status === "VERIFICATA").length;
          else if (indicatorIndex === 3) {
            value = atestate.filter((a) => {
              if (a.organization_name !== org) return false;
              if (a.trimis_at) {
                const d = new Date(a.trimis_at);
                return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
              }
              return false;
            }).length;
          }

          row.push(`${indicator}: ${value}`);
          if (orgIndex < activeOrgs.length - 1) row.push("");
        });
        data.push(row);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(data);

      activeOrgs.forEach((org, orgIndex) => {
        const colIndex = orgIndex * 2;
        for (let R = 0; R <= 5; R++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: colIndex });
          if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
          
          worksheet[cellAddress].s = {
            border: {
              top: R === 0 ? { style: 'thin', color: { rgb: "000000" } } : undefined,
              bottom: (R === 0 || R === 5) ? { style: 'thin', color: { rgb: "000000" } } : undefined,
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
          },
            font: R === 0 ? { bold: true } : undefined
          };
        }
      });

      XLSX.utils.book_append_sheet(workbook, worksheet, month.l);
    });

    // Create total year sheet
    const activeOrgsYear = allOrgsFromAtestate.filter(org => {
      return atestate.some(a => {
        if (a.organization_name !== org) return false;
        if (a.created_date) {
          const d = new Date(a.created_date);
          return getYear(d) === currentYear;
        }
        return false;
      });
    });

    if (activeOrgsYear.length > 0) {
      const indicators = [
        "Total Atestate",
        "Primite",
        "Verificate",
        `Trimise ${currentYear}`
      ];

      const yearData = [];
      
      const headerRow = [];
      activeOrgsYear.forEach((org, index) => {
        headerRow.push(org);
        if (index < activeOrgsYear.length - 1) headerRow.push("");
      });
      yearData.push(headerRow);

      indicators.forEach((indicator, indicatorIndex) => {
        const row = [];
        activeOrgsYear.forEach((org, orgIndex) => {
          const orgAtestate = atestate.filter((a) => {
            if (a.organization_name !== org) return false;
            if (a.created_date) {
              const d = new Date(a.created_date);
              return getYear(d) === currentYear;
            }
            return false;
          });

          let value = 0;
          if (indicatorIndex === 0) value = orgAtestate.length;
          else if (indicatorIndex === 1) value = orgAtestate.filter(a => a.status === "PRIMITA").length;
          else if (indicatorIndex === 2) value = orgAtestate.filter(a => a.status === "VERIFICATA").length;
          else if (indicatorIndex === 3) {
            value = atestate.filter((a) => {
              if (a.organization_name !== org) return false;
              if (a.trimis_at) {
                const d = new Date(a.trimis_at);
                return getYear(d) === currentYear;
              }
              return false;
            }).length;
          }

          row.push(`${indicator}: ${value}`);
          if (orgIndex < activeOrgsYear.length - 1) row.push("");
        });
        yearData.push(row);
      });

      const yearWorksheet = XLSX.utils.aoa_to_sheet(yearData);

      activeOrgsYear.forEach((org, orgIndex) => {
        const colIndex = orgIndex * 2;
        for (let R = 0; R <= 5; R++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: colIndex });
          if (!yearWorksheet[cellAddress]) yearWorksheet[cellAddress] = { t: 's', v: '' };
          
          yearWorksheet[cellAddress].s = {
            border: {
              top: R === 0 ? { style: 'thin', color: { rgb: "000000" } } : undefined,
              bottom: (R === 0 || R === 5) ? { style: 'thin', color: { rgb: "000000" } } : undefined,
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            },
            font: R === 0 ? { bold: true } : undefined
          };
        }
      });

      XLSX.utils.book_append_sheet(workbook, yearWorksheet, `Total ${currentYear}`);
    }

    XLSX.writeFile(workbook, `raport-atestate-${currentYear}.xlsx`);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Statistici</h1>
        </div>
        <p className="text-gray-500 text-sm">Statistici generale privind listele de tipărire autorizații și atestatele.</p>
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
              disabled={user?.role !== 'admin' && user?.email !== 'florin.hritcu@sigurantaferoviara.ro'}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {activeTab === "dre" ? (
              <>
                <StatsCard title="Total DRE" value={currentKpi.total} icon={List} color="slate" />
                <StatsCard title="NOU" value={currentKpi.nou} icon={Clock} color="green" />
                <StatsCard title="REÎNNOIT" value={currentKpi.reinnoit} icon={CheckCircle} color="blue" />
                <StatsCard title="MODIFICAT" value={currentKpi.modificat} icon={Send} color="purple" />
              </>
            ) : (
              <>
                <StatsCard title={`Total ${kpiLabel}`} value={currentKpi.total} icon={List} color="slate" />
                <StatsCard title="PRIMITE" value={currentKpi.primita} icon={Clock} color="amber" />
                <StatsCard title="VERIFICATE" value={currentKpi.verificata} icon={CheckCircle} color="blue" />
                <StatsCard title={`Trimise ${months.find(m => m.v === filterMonth)?.l} ${filterYear}`} value={currentKpi.trimisaLuna} icon={Calendar} color="violet" />
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {user?.email !== 'cecilia.mihaila@sigurantaferoviara.ro' && user?.email !== 'alexandra.stefan@sigurantaferoviara.ro' && user?.email !== 'florin.hritcu@sigurantaferoviara.ro' && (
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
                {(user?.has_atestate_role || user?.role === 'admin') && user?.email !== 'daniel.bulearca@sigurantaferoviara.ro' && user?.email !== 'florin.hritcu@sigurantaferoviara.ro' && (
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
                {(user?.has_dre_role || user?.role === 'admin' || user?.email === 'florin.hritcu@sigurantaferoviara.ro') && user?.email !== 'cecilia.mihaila@sigurantaferoviara.ro' && user?.email !== 'alexandra.stefan@sigurantaferoviara.ro' && (
                  <button
                    onClick={() => setActiveTab("dre")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "dre"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Statistici DRE
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
                      {["ISF / CISF / SCSC", "Total Liste", "Total Autorizații", "Total Vize", "Total Duplicate", "Total Schimbare nume", "PRIMITE", "VERIFICATE", `Trimise ${months.find(m => m.v === filterMonth)?.l}`].map((h) => (
                        <th key={h} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isfStats.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">
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
          ) : activeTab === "atestate" ? (
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
                      {["ISF / CISF / SCSC", "Total Atestate", "PRIMITE", "VERIFICATE", `Trimise ${months.find(m => m.v === filterMonth)?.l}`].map((h) => (
                        <th key={h} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {atestateStats.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
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
                  <h2 className="text-base font-bold text-gray-900">Statistici DRE per ISF / CISF / SCSC</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["ISF / CISF / SCSC", "Total DRE", "NOU", "REÎNNOIT", "MODIFICAT"].map((h) => (
                        <th key={h} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dreStats.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                          Nu există date disponibile.
                        </td>
                      </tr>
                    ) : (
                      dreStats.map((row) => (
                        <tr key={row.organization_name} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">{row.organization_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.total}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              {row.nou}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {row.reinnoit}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                              {row.modificat}
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
