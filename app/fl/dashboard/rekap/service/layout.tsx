"use client";

import React, { ReactNode, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PieChart, ArrowLeft, CoinsIcon, ArrowUp } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import LoadingScreen from "@/components/LoadingScreen";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ServicesRecapLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Tombol scroll-to-top cuma muncul kalau udah scroll ke bawah dikit
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Konfigurasi Navigasi
  const navItems = [
    {
      label: "Recap",
      href: "/fl/dashboard/rekap/service/recap", // Sesuaikan path aslinya
      icon: LayoutDashboard,
    },
    {
      label: "Pencairan",
      href: "/fl/dashboard/rekap/service/pencairan",
      icon: CoinsIcon,
    },
    {
      label: "Statistik",
      href: "/fl/dashboard/rekap/service/statistic",
      icon: PieChart,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300">
      {/* HEADER NAV / IBU */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">

            {/* Kiri: Tombol Back */}
            <Link
              href="/fl/dashboard/rekap/service"
              className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group shrink-0"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium hidden sm:block">Back</span>
            </Link>

            {/* Tengah: Navigation Tabs */}
            <nav className="flex items-center gap-0.5 sm:gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0",
                      isActive
                        ? "bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "animate-pulse" : "")} />
                    <span className="hidden xs:inline sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Kanan: Badge Role / Status (Opsional) */}
            <div className="hidden md:flex items-center shrink-0">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Live Monitor
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* BODY / CUCU */}
      <main className="max-w-7xl mx-auto">
        <Suspense fallback={<LoadingScreen />}>
          {children}
        </Suspense>
      </main>

      {/* Tombol scroll-to-top - muncul begitu user scroll ke bawah */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Kembali ke atas"
        className={cn(
          "fixed bottom-4 right-4 z-50 bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg shadow-orange-600/20 active:scale-95 transition-all",
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        )}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}