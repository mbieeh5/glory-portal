"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wrench,
  ShoppingBag,
  ArrowRight,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function LandingPage() {
  const accentColor = "text-orange-500";

  return (
    <div>
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 backdrop-blur-md border-b bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <span className="font-bold text-xl tracking-tight">
              GLORY<span className={accentColor}>CELL</span>
            </span>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* --- HERO --- */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
              Professional Digital & Hardware Solutions
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-2">
              Solusi Tepat, <span className="text-orange-500">Hasil Cepat.</span>
            </h1>

            <p className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
              Satu portal untuk semua kebutuhan gadgetmu. Cek status servis atau belanja kebutuhan digital tanpa ribet.
            </p>
          </motion.div>
        </div>

        {/* --- CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
          
          {/* SERVIS */}
          <Link href="/services" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full p-8 rounded-3xl border-2 bg-card border-border hover:border-orange-500/50 transition-all relative overflow-hidden"
            >
              <Wrench className="absolute -right-10 -bottom-10 w-64 h-64 opacity-5 group-hover:rotate-12 transition-transform text-orange-500" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-orange-50 dark:bg-orange-500/10">
                  <Smartphone className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                </div>

                <h2 className="text-3xl font-bold mb-3 group-hover:text-orange-500 transition-colors">
                  Cek Servis
                </h2>

                <p className="text-muted-foreground mb-6">
                  Pantau status perbaikan HP-mu secara realtime. Transparan, detail, dan terpercaya.
                </p>
              </div>

              <div className="relative z-10 flex items-center font-semibold text-orange-500 group-hover:translate-x-2 transition-transform">
                Cek Sekarang <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </motion.div>
          </Link>

          {/* TOKO */}
          <Link href="/profile" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full p-8 rounded-3xl border-2 bg-card border-border hover:border-blue-500/50 transition-all relative overflow-hidden"
            >
              <ShoppingBag className="absolute -right-10 -bottom-10 w-64 h-64 opacity-5 group-hover:-rotate-12 transition-transform text-blue-500" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-blue-50 dark:bg-blue-500/10">
                  <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>

                <h2 className="text-3xl font-bold mb-3 group-hover:text-blue-500 transition-colors">
                  Katalog & Jasa
                </h2>

                <p className="text-muted-foreground mb-6">
                  Lihat stok HP terbaru, aksesoris, atau layanan jasa transfer antar bank yang tersedia.
                </p>
              </div>

              <div className="relative z-10 flex items-center font-semibold text-blue-500 group-hover:translate-x-2 transition-transform">
                Masuk ke Toko <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </motion.div>
          </Link>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-8 text-center border-t bg-background text-muted-foreground">
        <p className="text-sm">
          &copy; 2026 Glory Cell. Member of{" "}
          <span className="font-bold text-orange-500">rrafproject</span> ecosystem.
        </p>
      </footer>
    </div>
  );
}