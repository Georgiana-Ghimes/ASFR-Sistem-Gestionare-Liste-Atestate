import React from "react";
import { X } from "lucide-react";

export default function PDFViewerModal({ url, filename, onClose }) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Vizualizare PDF</h3>
            {filename && <p className="text-sm text-gray-500 mt-0.5">{filename}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={url}
            className="w-full h-full min-h-[70vh]"
            title={filename || "PDF Viewer"}
          />
        </div>
      </div>
    </div>
  );
}