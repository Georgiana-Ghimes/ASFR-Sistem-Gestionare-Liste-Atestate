import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, List, FilePlus, LogOut, FileText, Settings, Award } from "lucide-react";

export default function Sidebar({ user }) {
  const location = useLocation();
  const { logout } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const hasAtestateRole = user?.has_atestate_role;

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: isAdmin ? "Administrare Liste" : "Listele mele", path: isAdmin ? "/all-lists" : "/my-lists", icon: List },
    { label: "Creare Listă", path: "/create-list", icon: FilePlus },
    ...(hasAtestateRole
      ? [{ label: isAdmin ? "Administrare Atestate" : "Atestatele mele", path: isAdmin ? "/all-atestate" : "/my-atestate", icon: Award }]
      : []),
    ...(isAdmin
      ? [{ label: "Setări", path: "/settings", icon: Settings }]
      : []),
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col shadow-2xl">
      <div className="px-6 py-8 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-1">
            <img src="/asfr-emboss.png" alt="ASFR" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Autorizații</p>
            <p className="text-slate-400 text-xs">Tipărire Liste</p>
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
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
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
        {(user?.isf_name || user?.cisf_name) && (
          <p className="text-blue-400 text-xs mt-0.5 font-medium">{user.isf_name || user.cisf_name}</p>
        )}
        <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-300">
          {user?.role}
        </span>
      </div>

      <div className="px-3 pb-6">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Deconectare
        </button>
      </div>
    </aside>
  );
}