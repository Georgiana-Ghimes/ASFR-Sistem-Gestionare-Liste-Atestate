import React from "react";
import { Award, AlertCircle } from "lucide-react";

export default function AllAtestate({ user }) {
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">Acces neautorizat. Doar administratorii pot accesa această pagină.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-pink-600" />
          <h1 className="text-2xl font-bold text-gray-900">Administrare Atestate</h1>
        </div>
        <p className="text-gray-500 text-sm">Vizualizare și gestionare toate atestatele</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Secțiune în dezvoltare</h2>
          <p className="text-gray-500 text-sm">Funcționalitatea pentru atestate va fi adăugată în curând.</p>
        </div>
      </div>
    </div>
  );
}
