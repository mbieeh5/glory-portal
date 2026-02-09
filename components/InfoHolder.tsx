"use client";

import { useState } from "react";
import { X, Info } from "lucide-react";

export default function InfoHolder() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="mx-4 mt-4 transition-all duration-300">
      <div className="relative flex items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-500" />
          <p>
            <span className="font-bold text-blue-800">System Info:</span> Server Online,Jika ada keluhan/bug bisa laporkan ke admin.
          </p>
        </div>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 transition-colors rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}