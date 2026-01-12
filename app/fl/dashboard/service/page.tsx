"use client"
import React from "react";
import { Calendar, TrendingUp, Users, Briefcase, Clock } from "lucide-react";
import { useTheme } from "next-themes";

const recentActivity = [
  { id: 1, user: "Ahmad", action: "Service iPhone 13 Pro selesai", time: "2 menit lalu" },
  { id: 2, user: "Siti", action: "Tambah customer baru", time: "10 menit lalu" },
  { id: 3, user: "Budi", action: "Update stok sparepart", time: "1 jam lalu" },
  { id: 4, user: "Rani", action: "Service Samsung A54 selesai", time: "2 jam lalu" },
];

// Mock data buat ditampilin
// eslint-disable-next-line
const stats: Array<{ name: string; value: number | string; icon: any; color: string }> = [
  { 
    name: "Penerimaan Service Hari Ini", 
    value: 24,
    icon: Calendar,
    color: "from-blue-500 to-cyan-500"
  },
  { 
    name: "Poin", 
    value: 133773,
    icon: TrendingUp,
    color: "from-purple-500 to-pink-500"
  },
  { 
    name: "Penerimaan Service Bulan Ini", 
    value: 42,
    icon: Users,
    color: "from-green-500 to-emerald-500"
  },
  { 
    name: "Jabatan", 
    value: "FL (Frontline)",
    icon: Briefcase,
    color: "from-orange-500 to-red-500"
  },
];

export default function DashboardHome() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen p-4 md:p-6 lg:p-8 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-black-900 via-black-800 to-black-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Dashboard Service
          </h1>
          <p className={`text-sm md:text-base ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Stats Section - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className={`relative backdrop-blur-xl rounded-2xl p-5 md:p-6 
                             transition-all duration-300 hover:scale-[1.02] group overflow-hidden ${
                      isDark 
                        ? 'bg-gray-800/60 border border-gray-700/50 hover:border-gray-600/50' 
                        : 'bg-white/80 border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Gradient Background Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} ${
                          isDark ? 'bg-opacity-10' : 'bg-opacity-15'
                        }`}>
                          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                      </div>
                      
                      <p className={`text-xs md:text-sm mb-2 font-medium ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {stat.name}
                      </p>
                      
                      <p className={`text-2xl md:text-3xl lg:text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {typeof stat.value === "number"
                          ? stat.value.toLocaleString("id-ID")
                          : stat.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Info Cards */}
            <div className={`backdrop-blur-xl rounded-2xl p-5 md:p-6 transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-800/60 border border-gray-700/50' 
                : 'bg-white/80 border border-gray-200/80 shadow-sm'
            }`}>
              <h3 className={`text-lg md:text-xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Ringkasan Hari Ini
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className={`text-xs md:text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Total Service
                  </p>
                  <p className={`text-xl md:text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    24
                  </p>
                </div>
                <div className="space-y-1">
                  <p className={`text-xs md:text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Service Selesai
                  </p>
                  <p className="text-xl md:text-xl font-bold text-green-500">18</p>
                </div>
                <div className="space-y-1">
                  <p className={`text-xs md:text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Dalam Proses
                  </p>
                  <p className="text-xl md:text-xl font-bold text-yellow-500">6</p>
                </div>
                <div className="space-y-1">
                  <p className={`text-xs md:text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Estimasi Selesai
                  </p>
                  <p className="text-xl md:text-xl font-bold text-blue-500">3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className={`backdrop-blur-xl rounded-xl p-5 md:p-6 h-full transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-800/60 border border-gray-700/50' 
                : 'bg-white/80 border border-gray-200/80 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className={`text-lg md:text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Aktivitas Terakhir
                </h2>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`group pb-4 border-b last:border-0 last:pb-0 
                             -mx-2 px-2 py-2 rounded-lg transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-700/50 hover:bg-gray-700/20' 
                        : 'border-gray-200/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with gradient */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 
                                    flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {activity.user.charAt(0)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm md:text-base truncate ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {activity.user}
                        </p>
                        <p className={`text-xs md:text-sm mt-0.5 line-clamp-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {activity.action}
                        </p>
                        <span className={`text-xs mt-1 inline-block ${
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              <button className={`w-full mt-4 py-2.5 rounded-xl text-sm font-medium 
                               transition-all duration-200 ${
                isDark 
                  ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50 hover:border-gray-500' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}>
                Lihat Semua Aktivitas
              </button>
            </div>
          </div>
        </div>

        {/* Bottom spacing for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
}