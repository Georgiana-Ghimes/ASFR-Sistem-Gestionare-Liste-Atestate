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

  const handleGenerateListeReport = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthName = months.find(m => m.v === String(currentMonth).padStart(2, "0"))?.l;
    
    const workbook = XLSX.utils.book_new();
    const data = [];
    let currentRow = 0;

    // Get all ISFs and create blocks for each
    allISFs.forEach((isf, index) => {
      // Filter lists for this ISF in current month
      const isfLists = lists.filter((l) => {
        if (l.isf_name !== isf) return false;
        if (l.created_date) {
          const d = new Date(l.created_date);
          return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
        }
        return false;
      });

      const trimiseInLuna = lists.filter((l) => {
        if (l.isf_name !== isf) return false;
        if (l.trimis_at) {
          const d = new Date(l.trimis_at);
          return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
        }
        return false;
      }).length;

      const totalAutorizatii = isfLists.filter((l) => l.tip === "Autorizatii").length;
      const totalVize = isfLists.filter((l) => l.tip === "Vize").length;
      const totalDuplicate = isfLists.filter((l) => l.tip === "Duplicate").length;
      const totalSchimbareNume = isfLists.filter((l) => l.tip === "Schimbare nume").length;

      // Add ISF block
      data.push([`Isf (${isf})`, "Valoare"]);
      data.push(["Total Liste", isfLists.length]);
      data.push(["Total Autorizații", totalAutorizatii]);
      data.push(["Total Vize", totalVize]);
      data.push(["Total Duplicate", totalDuplicate]);
      data.push(["Total Schimbare nume", totalSchimbareNume]);
      data.push(["Primite", isfLists.filter((l) => l.status === "PRIMITA").length]);
      data.push(["Verificate", isfLists.filter((l) => l.status === "VERIFICATA").length]);
      data.push(["Trimise", isfLists.filter((l) => l.status === "TRIMISA").length]);
      data.push([`Trimise ${monthName}`, trimiseInLuna]);

      // Add empty row between blocks (except after last one)
      if (index < allISFs.length - 1) {
        data.push(["", ""]);
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Apply borders to each ISF block
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    let blockStart = 0;
    
    allISFs.forEach((isf, index) => {
      const blockEnd = blockStart + 9; // 10 rows per block (header + 9 data rows)
      
      // Apply thin border around the entire block
      for (let R = blockStart; R <= blockEnd; R++) {
        for (let C = 0; C <= 1; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
          if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
          
          worksheet[cellAddress].s.border = {
            top: R === blockStart ? { style: 'thin' } : undefined,
            bottom: R === blockEnd ? { style: 'thin' } : undefined,
            left: C === 0 ? { style: 'thin' } : undefined,
            right: C === 1 ? { style: 'thin' } : undefined
          };
        }
      }
      
      blockStart = blockEnd + 2; // Move to next block (skip empty row)
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, monthName);
    XLSX.writeFile(workbook, `raport-liste-${monthName.toLowerCase()}-${currentYear}.xlsx`);
  };

  const handleGenerateAtestateReport = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthName = months.find(m => m.v === String(currentMonth).padStart(2, "0"))?.l;
    
    const workbook = XLSX.utils.book_new();
    const data = [];

    // Get all organizations and create blocks for each
    allOrgsFromAtestate.forEach((org, index) => {
      // Filter atestate for this organization in current month
      const orgAtestate = atestate.filter((a) => {
        if (a.organization_name !== org) return false;
        if (a.created_date) {
          const d = new Date(a.created_date);
          return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
        }
        return false;
      });

      const trimiseInLuna = atestate.filter((a) => {
        if (a.organization_name !== org) return false;
        if (a.trimis_at) {
          const d = new Date(a.trimis_at);
          return getMonth(d) + 1 === currentMonth && getYear(d) === currentYear;
        }
        return false;
      }).length;

      // Add organization block
      data.push([`Organizație (${org})`, "Valoare"]);
      data.push(["Total Atestate", orgAtestate.length]);
      data.push(["Primite", orgAtestate.filter((a) => a.status === "PRIMITA").length]);
      data.push(["Verificate", orgAtestate.filter((a) => a.status === "VERIFICATA").length]);
      data.push(["Trimise", orgAtestate.filter((a) => a.status === "TRIMISA").length]);
      data.push([`Trimise ${monthName}`, trimiseInLuna]);

      // Add empty row between blocks (except after last one)
      if (index < allOrgsFromAtestate.length - 1) {
        data.push(["", ""]);
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Apply borders to each organization block
    let blockStart = 0;
    
    allOrgsFromAtestate.forEach((org, index) => {
      const blockEnd = blockStart + 5; // 6 rows per block (header + 5 data rows)
      
      // Apply thin border around the entire block
      for (let R = blockStart; R <= blockEnd; R++) {
        for (let C = 0; C <= 1; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
          if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
          
          worksheet[cellAddress].s.border = {
            top: R === blockStart ? { style: 'thin' } : undefined,
            bottom: R === blockEnd ? { style: 'thin' } : undefined,
            left: C === 0 ? { style: 'thin' } : undefined,
            right: C === 1 ? { style: 'thin' } : undefined
          };
        }
      }
      
      blockStart = blockEnd + 2; // Move to next block (skip empty row)
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
      const data = [];

      // Get all ISFs and create blocks for each
      allISFs.forEach((isf, index) => {
        const isfLists = lists.filter((l) => {
          if (l.isf_name !== isf) return false;
          if (l.created_date) {
            const d = new Date(l.created_date);
            return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
          }
          return false;
        });

        const trimiseInLuna = lists.filter((l) => {
          if (l.isf_name !== isf) return false;
          if (l.trimis_at) {
            const d = new Date(l.trimis_at);
            return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
          }
          return false;
        }).length;

        const totalAutorizatii = isfLists.filter((l) => l.tip === "Autorizatii").length;
        const totalVize = isfLists.filter((l) => l.tip === "Vize").length;
        const totalDuplicate = isfLists.filter((l) => l.tip === "Duplicate").length;
        const totalSchimbareNume = isfLists.filter((l) => l.tip === "Schimbare nume").length;

        // Add ISF block
        data.push([`Isf (${isf})`, "Valoare"]);
        data.push(["Total Liste", isfLists.length]);
        data.push(["Total Autorizații", totalAutorizatii]);
        data.push(["Total Vize", totalVize]);
        data.push(["Total Duplicate", totalDuplicate]);
        data.push(["Total Schimbare nume", totalSchimbareNume]);
        data.push(["Primite", isfLists.filter((l) => l.status === "PRIMITA").length]);
        data.push(["Verificate", isfLists.filter((l) => l.status === "VERIFICATA").length]);
        data.push(["Trimise", isfLists.filter((l) => l.status === "TRIMISA").length]);
        data.push([`Trimise ${month.l}`, trimiseInLuna]);

        // Add empty row between blocks (except after last one)
        if (index < allISFs.length - 1) {
          data.push(["", ""]);
        }
      });

      const worksheet = XLSX.utils.aoa_to_sheet(data);

      // Apply borders to each ISF block
      let blockStart = 0;
      allISFs.forEach((isf, index) => {
        const blockEnd = blockStart + 9;
        
        for (let R = blockStart; R <= blockEnd; R++) {
          for (let C = 0; C <= 1; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
            if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
            
            worksheet[cellAddress].s.border = {
              top: R === blockStart ? { style: 'thin' } : undefined,
              bottom: R === blockEnd ? { style: 'thin' } : undefined,
              left: C === 0 ? { style: 'thin' } : undefined,
              right: C === 1 ? { style: 'thin' } : undefined
            };
          }
        }
        
        blockStart = blockEnd + 2;
      });

      XLSX.utils.book_append_sheet(workbook, worksheet, month.l);
    });

    // Create total year sheet with all ISFs
    const yearData = [];
    allISFs.forEach((isf, index) => {
      const isfLists = lists.filter((l) => {
        if (l.isf_name !== isf) return false;
        if (l.created_date) {
          const d = new Date(l.created_date);
          return getYear(d) === currentYear;
        }
        return false;
      });

      const trimiseInAn = lists.filter((l) => {
        if (l.isf_name !== isf) return false;
        if (l.trimis_at) {
          const d = new Date(l.trimis_at);
          return getYear(d) === currentYear;
        }
        return false;
      }).length;

      const totalAutorizatii = isfLists.filter((l) => l.tip === "Autorizatii").length;
      const totalVize = isfLists.filter((l) => l.tip === "Vize").length;
      const totalDuplicate = isfLists.filter((l) => l.tip === "Duplicate").length;
      const totalSchimbareNume = isfLists.filter((l) => l.tip === "Schimbare nume").length;

      yearData.push([`Isf (${isf})`, "Valoare"]);
      yearData.push(["Total Liste", isfLists.length]);
      yearData.push(["Total Autorizații", totalAutorizatii]);
      yearData.push(["Total Vize", totalVize]);
      yearData.push(["Total Duplicate", totalDuplicate]);
      yearData.push(["Total Schimbare nume", totalSchimbareNume]);
      yearData.push(["Primite", isfLists.filter((l) => l.status === "PRIMITA").length]);
      yearData.push(["Verificate", isfLists.filter((l) => l.status === "VERIFICATA").length]);
      yearData.push(["Trimise", isfLists.filter((l) => l.status === "TRIMISA").length]);
      yearData.push([`Trimise ${currentYear}`, trimiseInAn]);

      if (index < allISFs.length - 1) {
        yearData.push(["", ""]);
      }
    });

    const yearWorksheet = XLSX.utils.aoa_to_sheet(yearData);

    // Apply borders to year sheet
    let blockStart = 0;
    allISFs.forEach((isf, index) => {
      const blockEnd = blockStart + 9;
      
      for (let R = blockStart; R <= blockEnd; R++) {
        for (let C = 0; C <= 1; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!yearWorksheet[cellAddress]) yearWorksheet[cellAddress] = { t: 's', v: '' };
          if (!yearWorksheet[cellAddress].s) yearWorksheet[cellAddress].s = {};
          
          yearWorksheet[cellAddress].s.border = {
            top: R === blockStart ? { style: 'thin' } : undefined,
            bottom: R === blockEnd ? { style: 'thin' } : undefined,
            left: C === 0 ? { style: 'thin' } : undefined,
            right: C === 1 ? { style: 'thin' } : undefined
          };
        }
      }
      
      blockStart = blockEnd + 2;
    });

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
      const data = [];

      // Get all organizations and create blocks for each
      allOrgsFromAtestate.forEach((org, index) => {
        const orgAtestate = atestate.filter((a) => {
          if (a.organization_name !== org) return false;
          if (a.created_date) {
            const d = new Date(a.created_date);
            return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
          }
          return false;
        });

        const trimiseInLuna = atestate.filter((a) => {
          if (a.organization_name !== org) return false;
          if (a.trimis_at) {
            const d = new Date(a.trimis_at);
            return getMonth(d) + 1 === monthNum && getYear(d) === currentYear;
          }
          return false;
        }).length;

        // Add organization block
        data.push([`Organizație (${org})`, "Valoare"]);
        data.push(["Total Atestate", orgAtestate.length]);
        data.push(["Primite", orgAtestate.filter((a) => a.status === "PRIMITA").length]);
        data.push(["Verificate", orgAtestate.filter((a) => a.status === "VERIFICATA").length]);
        data.push(["Trimise", orgAtestate.filter((a) => a.status === "TRIMISA").length]);
        data.push([`Trimise ${month.l}`, trimiseInLuna]);

        // Add empty row between blocks (except after last one)
        if (index < allOrgsFromAtestate.length - 1) {
          data.push(["", ""]);
        }
      });

      const worksheet = XLSX.utils.aoa_to_sheet(data);

      // Apply borders to each organization block
      let blockStart = 0;
      allOrgsFromAtestate.forEach((org, index) => {
        const blockEnd = blockStart + 5;
        
        for (let R = blockStart; R <= blockEnd; R++) {
          for (let C = 0; C <= 1; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
            if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
            
            worksheet[cellAddress].s.border = {
              top: R === blockStart ? { style: 'thin' } : undefined,
              bottom: R === blockEnd ? { style: 'thin' } : undefined,
              left: C === 0 ? { style: 'thin' } : undefined,
              right: C === 1 ? { style: 'thin' } : undefined
            };
          }
        }
        
        blockStart = blockEnd + 2;
      });

      XLSX.utils.book_append_sheet(workbook, worksheet, month.l);
    });

    // Create total year sheet with all organizations
    const yearData = [];
    allOrgsFromAtestate.forEach((org, index) => {
      const orgAtestate = atestate.filter((a) => {
        if (a.organization_name !== org) return false;
        if (a.created_date) {
          const d = new Date(a.created_date);
          return getYear(d) === currentYear;
        }
        return false;
      });

      const trimiseInAn = atestate.filter((a) => {
        if (a.organization_name !== org) return false;
        if (a.trimis_at) {
          const d = new Date(a.trimis_at);
          return getYear(d) === currentYear;
        }
        return false;
      }).length;

      yearData.push([`Organizație (${org})`, "Valoare"]);
      yearData.push(["Total Atestate", orgAtestate.length]);
      yearData.push(["Primite", orgAtestate.filter((a) => a.status === "PRIMITA").length]);
      yearData.push(["Verificate", orgAtestate.filter((a) => a.status === "VERIFICATA").length]);
      yearData.push(["Trimise", orgAtestate.filter((a) => a.status === "TRIMISA").length]);
      yearData.push([`Trimise ${currentYear}`, trimiseInAn]);

      if (index < allOrgsFromAtestate.length - 1) {
        yearData.push(["", ""]);
      }
    });

    const yearWorksheet = XLSX.utils.aoa_to_sheet(yearData);

    // Apply borders to year sheet
    let blockStart = 0;
    allOrgsFromAtestate.forEach((org, index) => {
      const blockEnd = blockStart + 5;
      
      for (let R = blockStart; R <= blockEnd; R++) {
        for (let C = 0; C <= 1; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!yearWorksheet[cellAddress]) yearWorksheet[cellAddress] = { t: 's', v: '' };
          if (!yearWorksheet[cellAddress].s) yearWorksheet[cellAddress].s = {};
          
          yearWorksheet[cellAddress].s.border = {
            top: R === blockStart ? { style: 'thin' } : undefined,
            bottom: R === blockEnd ? { style: 'thin' } : undefined,
            left: C === 0 ? { style: 'thin' } : undefined,
            right: C === 1 ? { style: 'thin' } : undefined
          };
        }
      }
      
      blockStart = blockEnd + 2;
    });

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
