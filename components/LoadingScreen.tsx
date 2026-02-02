"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Kasih delay dikit biar gak flickering kalau koneksi lagi kenceng banget
    const timer = setTimeout(() => setShow(true), 2000); 
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-zinc-50 dark:bg-black flex flex-col items-center justify-center transition-colors duration-300">
      <div className="relative">
        {/* Glow effect di belakang loader */}
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-cyan-400 animate-spin relative z-10" />
      </div>
      <p className="mt-4 font-mono text-xs tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase animate-pulse">
        Initializing System...
      </p>
    </div>
  );
}