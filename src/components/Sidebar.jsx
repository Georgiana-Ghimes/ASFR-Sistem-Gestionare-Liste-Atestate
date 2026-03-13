import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, List, FilePlus, LogOut, FileText, Settings, Award, FileBadge, Download, FileStack } from "lucide-react";

export default function Sidebar({ user }) {
  const location = useLocation();
  const { logout } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const hasAtestateRole = user?.has_atestate_role;
  const hasDreRole = user?.has_dre_role;
  const isCecilia = user?.email === 'cecilia.mihaila@sigurantaferoviara.ro';
  const isAlexandra = user?.email === 'alexandra.stefan@sigurantaferoviara.ro';
  const isFlorin = user?.email === 'florin.hritcu@sigurantaferoviara.ro';
  const isRegularUser = ['isf', 'cisf', 'scsc'].includes(user?.role);

  let navItems = [];

  if (isCecilia || isAlexandra) {
    // Cecilia și Alexandra văd Dashboard și meniurile de Atestate
    navItems = [
      { label: "Statistici", path: "/dashboard", icon: LayoutDashboard },
      { label: "Administrare Atestate", path: "/all-atestate", icon: Award },
      { label: "Încărcare Atestate", path: "/create-atestat", icon: FileBadge }
    ];
  } else if (isFlorin) {
    // Florin vede Dashboard și meniurile de DRE
    navItems = [
      { label: "Statistici", path: "/dashboard", icon: LayoutDashboard },
      { label: "Administrare DRE", path: "/all-dre", icon: FileStack },
      { label: "Încărcare DRE", path: "/create-dre", icon: FileText }
    ];
  } else if (isAdmin) {
    // Administratorii (în afară de Cecilia și Florin) văd TOT
    navItems = [
      { label: "Statistici", path: "/dashboard", icon: LayoutDashboard },
      { label: "Administrare Liste", path: "/all-lists", icon: List },
      { label: "Încărcare Liste", path: "/create-list", icon: FilePlus },
      { label: "Administrare Atestate", path: "/all-atestate", icon: Award },
      { label: "Încărcare Atestate", path: "/create-atestat", icon: FileBadge },
      { label: "Administrare DRE", path: "/all-dre", icon: FileStack },
      { label: "Încărcare DRE", path: "/create-dre", icon: FileText },
      { label: "Setări", path: "/settings", icon: Settings }
    ];
  } else if (isRegularUser) {
    // Utilizatorii ISF/CISF/SCSC văd zonele lor
    navItems = [
      { label: "Statistici", path: "/dashboard", icon: LayoutDashboard },
      { label: "Listele mele", path: "/my-lists", icon: List },
      { label: "Încărcare Liste", path: "/create-list", icon: FilePlus },
      ...(hasAtestateRole
        ? [
            { label: "Atestatele mele", path: "/my-atestate", icon: Award },
            { label: "Încărcare Atestate", path: "/create-atestat", icon: FileBadge }
          ]
        : []),
      ...(hasDreRole
        ? [
            { label: "DRE-urile mele", path: "/my-dre", icon: FileStack },
            { label: "Încărcare DRE", path: "/create-dre", icon: FileText }
          ]
        : [])
    ];
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-800 flex flex-col shadow-2xl">
      <div className="px-6 py-8 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2">
            <img src="/asfr-emboss.png" alt="ASFR" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] leading-tight">Sistem de gestionare</p>
            <p className="text-white font-bold text-sm leading-tight">Liste/Atestate/DRE</p>
            <p className="text-slate-400 text-xs">ASFR ©</p>
            <p className="text-slate-500 text-[10px] mt-0.5">v1.0.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          // Determine color based on page category
          let activeColor = "bg-blue-600"; // default
          let iconColor = "text-blue-500"; // default icon color
          let hoverColor = "hover:bg-slate-700";
          
          if (item.path.includes('list')) {
            activeColor = "bg-green-600";
            iconColor = "text-green-500";
          } else if (item.path.includes('atestat')) {
            activeColor = "bg-pink-600";
            iconColor = "text-pink-500";
          } else if (item.path.includes('dre')) {
            activeColor = "bg-purple-600";
            iconColor = "text-purple-500";
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? `${activeColor} text-white shadow-md`
                  : `text-slate-300 hover:text-white ${hoverColor}`
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : iconColor}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <a
          href="/Ghid-Utilizare-Sistem-Gestionare-Liste-Atestate-ASFR.pdf"
          download="Ghid-Utilizare-Sistem-Gestionare-Liste-Atestate-ASFR.pdf"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-150"
        >
          <Download className="w-4 h-4" />
          Descarcă Documentație
        </a>
      </div>

      <div className="px-4 py-4 border-t border-slate-700/60">
        <p className="text-slate-400 text-xs mb-1">Conectat ca</p>
        <p className="text-white text-sm font-medium truncate">{user?.email}</p>
        {(user?.isf_name || user?.cisf_name || user?.scsc_name) && (
          <p className="text-blue-400 text-xs mt-0.5 font-medium">{user.isf_name || user.cisf_name || user.scsc_name}</p>
        )}
        <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-300">
          {user?.role}
        </span>
      </div>

      <div className="px-3 pb-6 flex justify-center">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Deconectare
        </button>
      </div>
    </aside>
  );
}