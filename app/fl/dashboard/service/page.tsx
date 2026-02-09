"use client"
import { useEffect, useState } from "react";
import { Calendar, TrendingUp, Users, Briefcase, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ActivityLog } from "@/config/type";

// ==========================================
// UTILITY: Format Time Ago (Bahasa Indonesia)
// ==========================================
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Baru saja";
  
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  
  return date.toLocaleDateString('id-ID'); // Fallback ke tanggal biasa kalo udah lama
};

export default function DashboardHome() {
  // State Stats
  const [stats, setStats] = useState([
    { name: "Penerimaan Service Hari Ini", value: 0, icon: Calendar, color: "from-blue-500 to-cyan-500" },
    { name: "Poin", value: 0, icon: TrendingUp, color: "from-purple-500 to-pink-500" },
    { name: "Service Selesai Bulan Ini", value: 0, icon: Users, color: "from-green-500 to-emerald-500" },
    { name: "Jabatan", value: "-", icon: Briefcase, color: "from-orange-500 to-red-500" },
  ]);

  // State Recent Activity
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient();
      const globalSchema = 'glory';

      // 1. Ambil User & Role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const role = user.app_metadata?.role || 'anon';
      const isBoss = ['admin', 'moderator'].includes(role);

      // Helper Dates
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      try {
        setLoading(true);

        // ==========================================
        // FETCH 1: STATS LOGIC (Sama kek tadi)
        // ==========================================
        
        // ... (Logic Stats Query - Daily)
        let dailyQuery = supabase.schema(globalSchema).from('services_transactions')
          .select('*', { count: 'exact', head: true }).gte('entry_datetime', startOfDay);
        if (!isBoss) dailyQuery = dailyQuery.eq('owner_id', user.id);
        const { count: dailyCount } = await dailyQuery;

        // ... (Logic Stats Query - Monthly)
        let monthlyQuery = supabase.schema(globalSchema).from('services_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed').not('pickedup_at', 'is', null)
          .gte('pickedup_at', startOfMonth).lte('pickedup_at', endOfMonth);
        if (!isBoss) monthlyQuery = monthlyQuery.eq('owner_id', user.id);
        const { count: monthlyCount } = await monthlyQuery;

        // ... (Logic Stats Query - Points)
        let totalPoints = 0;
        if (isBoss) {
          const { data: allProfiles } = await supabase.schema(globalSchema).from('profiles').select('point');
          totalPoints = allProfiles?.reduce((acc: number, curr: { point: number; }) => acc + (curr.point || 0), 0) || 0;
        } else {
          const { data: myProfile } = await supabase.schema(globalSchema).from('profiles')
            .select('point').eq('id', user.id).single();
          totalPoints = myProfile?.point || 0;
        }

        setStats([
          { name: "Penerimaan Service Hari Ini", value: dailyCount || 0, icon: Calendar, color: "from-blue-500 to-cyan-500" },
          { name: "Poin " + (isBoss ? "(Global)" : "(Personal)"), value: isBoss ? totalPoints : "Hah Kosyong?", icon: TrendingUp, color: "from-purple-500 to-pink-500" },
          { name: "Selesai Bulan Ini", value: monthlyCount || 0, icon: Users, color: "from-green-500 to-emerald-500" },
          { name: "Jabatan", value: role.charAt(0).toUpperCase() + role.slice(1), icon: Briefcase, color: "from-orange-500 to-red-500" },
        ]);

        // ==========================================
        // FETCH 2: RECENT ACTIVITY (Updated_at)
        // ==========================================
        
        // 1. Fetch Transaksi Terakhir (Updated At Descending)
        let activityQuery = supabase
          .schema(globalSchema)
          .from('services_transactions')
          .select('invoice_id, updated_at, owner_id, status') // Ambil field yg perlu aja
          .order('updated_at', { ascending: false })
          .limit(5); // Ambil 5 teratas

        // Kalau Frontliner, RLS sebenernya udah nge-block, tapi kita filter explicit biar aman
        if (!isBoss) {
            activityQuery = activityQuery.eq('owner_id', user.id);
        }

        const { data: recentTx } = await activityQuery;

        if (recentTx && recentTx.length > 0) {
            // 2. Kita butuh Nama dari Owner ID.
            // Ambil semua owner_id unik dari 5 transaksi tadi buat di-fetch namanya
            const ownerIds = [...new Set(recentTx.map(tx => tx.owner_id))];

            // Fetch Profiles berdasarkan ID tadi
            const { data: profiles } = await supabase
                .schema(globalSchema)
                .from('profiles')
                .select('id, full_name')
                .in('id', ownerIds);

            // 3. Mapping Data biar siap tampil
            const formattedActivities = recentTx.map((tx, index) => {
                // Cari nama owner di array profiles
                const ownerProfile = profiles?.find(p => p.id === tx.owner_id);
                const userName = ownerProfile?.full_name || 'Unknown User';

                return {
                    id: index, // key react
                    user: userName,
                    // Action: Tampilkan Invoice ID dan Statusnya
                    action: `Update Transaksi ${tx.invoice_id} (${tx.status})`,
                    // Time: Pake helper function
                    time: formatTimeAgo(tx.updated_at),
                    // Raw time buat sorting/debugging kalo perlu
                    rawTime: tx.updated_at 
                };
            });

            setActivities(formattedActivities);
        } else {
            setActivities([]);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 transition-colors duration-300 bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
            Dashboard Service
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-neutral-400">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Stats Section */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="relative backdrop-blur-xl rounded-2xl p-5 md:p-6 transition-all duration-300 hover:scale-[1.02] group overflow-hidden bg-white/80 dark:bg-neutral-900 border border-gray-200/80 dark:border-white/10 shadow-sm hover:shadow-md">
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-15 dark:bg-opacity-20`}>
                          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                      </div>
                      <p className="text-xs md:text-sm mb-2 font-medium text-gray-600 dark:text-neutral-400">{stat.name}</p>
                      {loading ? (
                         <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded"></div>
                      ) : (
                        <p className="text-2xl md:text-3xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                            {typeof stat.value === "number" ? stat.value.toLocaleString("id-ID") : stat.value}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Info Cards */}
            <div className="backdrop-blur-xl rounded-2xl p-5 md:p-6 transition-colors duration-300 bg-white/80 dark:bg-neutral-900 border border-gray-200/80 dark:border-white/10 shadow-sm">
              <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-900 dark:text-white">Ringkasan Hari Ini</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-neutral-400">Total Masuk</p>
                  <p className="text-xl md:text-xl font-bold text-gray-900 dark:text-white">{loading ? "..." : stats[0].value}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl rounded-xl p-5 md:p-6 h-full transition-colors duration-300 bg-white/80 dark:bg-neutral-900 border border-gray-200/80 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Aktivitas Terakhir</h2>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                    // Loading Skeleton Activity
                    [1,2,3].map((i) => (
                        <div key={i} className="animate-pulse flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-800 w-3/4 rounded"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-800 w-1/2 rounded"></div>
                            </div>
                        </div>
                    ))
                ) : activities.length > 0 ? (
                    activities.map((activity) => (
                    <div key={activity.id} className="group pb-4 border-b last:border-0 last:pb-0 -mx-2 px-2 py-2 rounded-lg transition-all duration-200 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {/* Ambil Huruf Depan */}
                            {activity.user?.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm md:text-base truncate text-gray-900 dark:text-white">
                            {activity.user}
                            </p>
                            <p className="text-xs md:text-sm mt-0.5 line-clamp-2 text-gray-600 dark:text-neutral-400">
                            {activity.action}
                            </p>
                            <span className="text-xs mt-1 inline-block text-gray-500">
                            {activity.time}
                            </span>
                        </div>
                        </div>
                    </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Belum ada aktivitas.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
}