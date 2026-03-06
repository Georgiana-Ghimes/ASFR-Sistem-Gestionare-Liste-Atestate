import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, List, FilePlus, LogOut, FileText, Settings, Award, FileBadge } from "lucide-react";

export default function Sidebar({ user }) {
  const location = useLocation();
  const { logout } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const hasAtestateRole = user?.has_atestate_role;
  const isCecilia = user?.email === 'cecilia.mihaila@sigurantaferoviara.ro';
  const isRegularUser = ['isf', 'cisf', 'scsc'].includes(user?.role);

  let navItems = [];

  if (isCecilia) {
    // Cecilia vede Dashboard și meniurile de Atestate
    navItems = [
      { label: "Statistici", path: "/dashboard", icon: LayoutDashboard },
      { label: "Administrare Atestate", path: "/all-atestate", icon: Award },
      { label: "Încărcare Atestate", path: "/create-atestat", icon: FileBadge }
    ];
  } else if (isAdmin) {
    // Administratorii (în afară de Cecilia) văd TOT
    navItems = [
      { label: "Statistici", path: "/dashboard", icon: LayoutDashboard },
      { label: "Administrare Liste", path: "/all-lists", icon: List },
      { label: "Încărcare Liste", path: "/create-list", icon: FilePlus },
      { label: "Administrare Atestate", path: "/all-atestate", icon: Award },
      { label: "Încărcare Atestate", path: "/create-atestat", icon: FileBadge },
      { label: "Setări", path: "/settings", icon: Settings }
    ];
  } else if (isRegularUser) {
    // Utilizatorii ISF/CISF/SCSC văd doar zonele lor
    navItems = [
      { label: "Statistici", path: "/dashboard", icon: LayoutDashboard },
      { label: "Listele mele", path: "/my-lists", icon: List },
      { label: "Încărcare Liste", path: "/create-list", icon: FilePlus },
      ...(hasAtestateRole
        ? [
            { label: "Atestatele mele", path: "/my-atestate", icon: Award },
            { label: "Încărcare Atestate", path: "/create-atestat", icon: FileBadge }
          ]
        : [])
    ];
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-800 flex flex-col shadow-2xl">
      <div className="px-6 py-8 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center p-2">
            <img src="/asfr-emboss.png" alt="ASFR" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] leading-tight">Sistem de gestionare</p>
            <p className="text-white font-bold text-sm leading-tight">Liste/Atestate</p>
            <p className="text-slate-400 text-xs">ASFR</p>
            <p className="text-slate-500 text-[10px] mt-0.5">v1.0.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

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

      <div className="px-3 pb-6">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Deconectare
        </button>
      </div>
    </aside>
  );
}