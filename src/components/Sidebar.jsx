import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, List, FilePlus, LogOut, FileText, Settings, Award, FileBadge, Download, FileStack, ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar({ user }) {
  const location = useLocation();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  }, [isCollapsed]);
  
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
    <aside className={`min-h-screen bg-slate-800 flex flex-col shadow-2xl transition-all duration-300 relative ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-4 z-50 w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-slate-800"
        title={isCollapsed ? "Deschide sidebar" : "Închide sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`border-b border-slate-700/60 transition-all duration-300 overflow-hidden ${isCollapsed ? 'h-0' : 'h-32'}`}>
        <div className={`flex items-center gap-3 px-6 py-8 transition-all duration-300 ${isCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2 flex-shrink-0">
            <img src="/asfr-emboss.png" alt="ASFR" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 text-[10px] leading-tight">Sistem de gestionare</p>
            <p className="text-white font-bold text-sm leading-tight">Liste/Atestate/DRE</p>
            <p className="text-slate-400 text-xs">ASFR ©</p>
            <p className="text-slate-500 text-[10px] mt-0.5">v1.0.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-3">
        {/* Dashboard - standalone */}
        {navItems.filter(item => item.path === '/dashboard').map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-200' : 'text-blue-400'}`} />
              {!isCollapsed && item.label}
            </Link>
          );
        })}

        {/* Liste group */}
        {navItems.filter(item => item.path.includes('list')).length > 0 && (
          <div className={`p-1 bg-green-900/20 border border-green-800/30 rounded-xl space-y-1 ${isCollapsed ? 'p-0.5' : ''}`}>
            {navItems.filter(item => item.path.includes('list')).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-green-600 text-white shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-green-200' : 'text-green-400'}`} />
                  {!isCollapsed && item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Atestate group */}
        {navItems.filter(item => item.path.includes('atestat')).length > 0 && (
          <div className={`p-1 bg-pink-900/20 border border-pink-800/30 rounded-xl space-y-1 ${isCollapsed ? 'p-0.5' : ''}`}>
            {navItems.filter(item => item.path.includes('atestat')).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-pink-600 text-white shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-pink-200' : 'text-pink-400'}`} />
                  {!isCollapsed && item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* DRE group */}
        {navItems.filter(item => item.path.includes('dre')).length > 0 && (
          <div className={`p-1 bg-purple-900/20 border border-purple-800/30 rounded-xl space-y-1 ${isCollapsed ? 'p-0.5' : ''}`}>
            {navItems.filter(item => item.path.includes('dre')).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-200' : 'text-purple-400'}`} />
                  {!isCollapsed && item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Settings - standalone */}
        {navItems.filter(item => item.path === '/settings').map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-200' : 'text-blue-400'}`} />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <a
          href="/Ghid-Utilizare-Sistem-Gestionare-Liste-Atestate-ASFR.pdf"
          download="Ghid-Utilizare-Sistem-Gestionare-Liste-Atestate-ASFR.pdf"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-150 ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Descarcă Documentație" : ''}
        >
          <Download className="w-4 h-4" />
          {!isCollapsed && "Descarcă Documentație"}
        </a>
      </div>

      {!isCollapsed && (
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
      )}

      <div className="px-3 pb-6 flex justify-center">
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-150 ${isCollapsed ? 'px-3' : ''}`}
          title={isCollapsed ? "Deconectare" : ''}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && "Deconectare"}
        </button>
      </div>
    </aside>
  );
}