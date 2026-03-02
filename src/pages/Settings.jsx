import React from "react";
import { AlertCircle, Settings as SettingsIcon } from "lucide-react";

export default function Settings({ user }) {
  if (!user || user.role !== "admin") {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">Acces neautorizat. Doar administratorii pot accesa setările.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Setări</h1>
        <p className="text-gray-500 mt-1 text-sm">Configurare sistem și preferințe.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Informații Sistem</h2>
            <p className="text-sm text-gray-500">Detalii despre aplicație și configurare</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Versiune</span>
            <span className="text-sm text-gray-900 font-semibold">1.0.0</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Bază de date</span>
            <span className="text-sm text-gray-900 font-semibold">PostgreSQL</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Utilizator curent</span>
            <span className="text-sm text-gray-900 font-semibold">{user.email}</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Rol</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              {user.role}
            </span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Notă:</span> Pentru gestionarea utilizatorilor, conectați-vă direct la baza de date PostgreSQL sau extindeți această pagină cu funcționalități de administrare.
          </p>
        </div>
      </div>
    </div>
  );
}
