"use client";

import React, { ReactNode, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PieChart, ArrowLeft } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import LoadingScreen from "@/components/LoadingScreen";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BanksRecapLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Konfigurasi Navigasi
  const navItems = [
    {
      label: "Recap",
      href: "/fl/dashboard/captain-only/bank/recap", // Sesuaikan path aslinya
      icon: LayoutDashboard,
    },
    {
      label: "Statistik",
      href: "/fl/dashboard/captain-only/bank/statistic",
      icon: PieChart,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300">
      {/* HEADER NAV / IBU */}
      <header className="sticky top z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Kiri: Tombol Back */}
            <Link
              href="/fl/dashboard/captain-only/bank"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium hidden sm:block">Back</span>
            </Link>

            {/* Tengah: Navigation Tabs */}
            <nav className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                      isActive 
                        ? "bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700" 
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "animate-pulse" : "")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Kanan: Badge Role / Status (Opsional) */}
            <div className="hidden md:flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Live Monitor
                </span>
            </div>
          </div>
        </div>
      </header>

      {/* BODY / CUCU */}
      <main className="mx-auto p-4 md:p-2 lg:p-4">
        <Suspense fallback={<LoadingScreen />}>
          {children}
        </Suspense>
      </main>

      {/* Mobile Indicator (Khusus buat Samsung Fold/HP pas di bawah) */}
      <footer className="md:hidden fixed bottom-4 right-4 z-50">
          <div className="bg-orange-600 text-white p-3 rounded-full shadow-lg shadow-orange-600/20 active:scale-95 transition-transform">
             <LayoutDashboard className="w-5 h-5" />
          </div>
      </footer>
    </div>
  );
}