import React, { useState } from "react";
import { FileText, AlertCircle } from "lucide-react";

export default function AllDre({ user }) {
  const [loading, setLoading] = useState(false);

  const isFlorin = user?.email === 'florin.hritcu@sigurantaferoviara.ro';
  const canAccess = user?.role === 'admin' || isFlorin;

  if (!user || !canAccess) {
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
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Administrare DRE</h1>
          </div>
          <p className="text-gray-500 text-sm">Vizualizare și gestionare toate DRE-urile</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Niciun DRE</h2>
          <p className="text-gray-500 text-sm">Nu există DRE-uri încărcate în sistem.</p>
        </div>
      </div>
    </div>
  );
}
