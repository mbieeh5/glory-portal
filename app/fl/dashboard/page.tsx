import Link from "next/link";
import { 
  ShieldAlert,
  Terminal,
  ChevronRight,
  Settings,
  UserCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { ModuleMenus } from "@/config/modules"
import { redirect } from "next/navigation";
import { JwtPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return data.claims;
}

export default async function PortalDashboard() {

    const getGreeting = (role: string) => {
      switch (role) {
        case "admin":
          return { title: "Captain", color: "text-red-600 dark:text-red-500", glow: "shadow-red-500/50", border: "border-red-500/30" };
        case "moderator":
          return { title: "Officer", color: "text-blue-600 dark:text-blue-500", glow: "shadow-blue-500/50", border: "border-blue-500/30" };
        case "frontliner":
          return { title: "Crew", color: "text-green-600 dark:text-green-500", glow: "shadow-green-500/50", border: "border-green-500/30" };
        default:
          return { title: "User", color: "text-zinc-600 dark:text-zinc-500", glow: "shadow-zinc-500/50", border: "border-zinc-500/30" };
      }
    }; 
  
    const userInfo = await UserDetails();
    const userRole = (userInfo as JwtPayload).app_metadata?.role || 'user';
    const greeting = getGreeting((userInfo as JwtPayload).app_metadata?.role || 'user');

  return (
    // Base Background: Light mode putih bersih, Dark mode hitam pekat
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-200 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 relative overflow-hidden transition-colors duration-300">
      
      {/* --- BACKGROUND EFFECTS (Optimized for Safari) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         
         {/* LIGHT MODE: Simple Grid (Clean & Fast) */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:hidden" />

         {/* DARK MODE: Space Effects (Hanya muncul pas Dark Mode) */}
         <div className="hidden dark:block absolute inset-0">
             {/* Animated Grid - Opacity dikurangi dikit biar gak berat */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_100%)]" />
             
             {/* Static Glows instead of animated blurs for Safari performance */}
             <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-3xl opacity-50" />
             <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-3xl opacity-50" />
             
             {/* Particles: Reduced count & added will-change-transform */}
             <div className="absolute inset-0 overflow-hidden opacity-70">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white/30 rounded-full animate-float will-change-transform"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${15 + Math.random() * 10}s`,
                    }}
                  />
                ))}
             </div>
         </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 md:gap-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Avatar */}
            <div className="relative group">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-transparent to-transparent group-hover:from-${greeting.color.split('-')[1]}-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500`} />
              <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-zinc-900 border-2 ${greeting.border} flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg dark:${greeting.glow}`}>
                <UserCircle size={32} className={`${greeting.color} transition-transform duration-300 group-hover:scale-110`} />
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs md:text-sm font-mono text-zinc-500 uppercase tracking-widest">
                  Welcome Aboard
                </p>
                <Sparkles size={12} className={`${greeting.color} animate-pulse`} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white flex flex-wrap items-center gap-2">
                <span className={`${greeting.color} font-extrabold tracking-tight`}>
                  {greeting.title}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">
                  {userInfo.email?.slice(0, userInfo.email.indexOf("@"))}
                </span>
              </h1>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  {userInfo.app_metadata?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Link href={'/fl/dashboard/settings'} passHref>
              <Button variant="outline" className="group border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300">
                <Settings size={16} className="text-zinc-700 dark:text-zinc-300 group-hover:rotate-90 transition-transform duration-500" />
                <span className="hidden md:inline ml-2 text-zinc-700 dark:text-zinc-300">Settings</span>
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col justify-center">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-sm">
              <Terminal size={18} className="text-blue-500 dark:text-cyan-400" />
              <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Select Module
              </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            {ModuleMenus.map((mod) => {
                const isDisabled = () => {
                  if (userRole === 'admin') return false;
                  const permissions:{frontliner: string[];moderator: string[]; user: string[]} = {
                    frontliner: ['bank', 'service'],
                    moderator: ['treasury', 'bank', 'service'],
                    user: []
                  };
                  const allowedMenus = permissions[userRole as keyof typeof permissions] || [];
                  return !allowedMenus.includes(mod.id);
                };
                
                // --- NOTE: Pastikan mod.accent dan mod.bgGradient support dark mode di config modules lu atau pake logic conditional di bawah ---
                
              return(
              <Link 
                key={mod.id} 
                href={isDisabled() ? '#' : mod.href}
                className={`block h-full ${isDisabled() ? 'cursor-not-allowed' : ''}`}
                aria-disabled={isDisabled()}
              >
                <div 
                  className={`
                    group relative h-full p-6 md:p-8 rounded-2xl border transition-all duration-300 overflow-hidden
                    ${isDisabled()
                      ? 'bg-zinc-100 dark:bg-zinc-950/30 border-dashed border-zinc-300 dark:border-yellow-900/30' 
                      : `bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-xl dark:hover:shadow-2xl`
                    }
                  `}
                >
                  {/* Hover Gradient Effect (Only visible on hover) */}
                  {!isDisabled() && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  )}

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className={`
                        relative p-4 rounded-xl border transition-all duration-300
                        ${isDisabled()
                          ? 'bg-zinc-200 dark:bg-yellow-900/10 border-zinc-300 dark:border-yellow-900/30 text-zinc-400 dark:text-yellow-700' 
                          : `bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white group-hover:scale-110 group-hover:rotate-3`
                        }
                      `}>
                        <mod.icon size={28} className={isDisabled() ? 'text-zinc-400 dark:text-yellow-700' : 'text-blue-600 dark:text-cyan-400'} />
                      </div>

                      <div className={`
                        flex items-center gap-2 text-[10px] font-mono uppercase border px-3 py-1.5 rounded-full transition-all duration-300
                        ${isDisabled()
                          ? 'border-zinc-300 dark:border-yellow-900/30 bg-zinc-100 dark:bg-yellow-900/10 text-zinc-400 dark:text-yellow-600' 
                          : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400'
                        }
                      `}>
                        {!isDisabled() && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                        {mod.stat}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h3 className={`
                        text-2xl font-bold mb-2 tracking-tight transition-colors duration-300
                        ${isDisabled() ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-100'}
                      `}>
                        {mod.title}
                      </h3>
                      <p className={`
                        text-xs font-bold tracking-widest uppercase
                        ${isDisabled() ? 'text-zinc-400 dark:text-zinc-700' : 'text-zinc-500 dark:text-zinc-500'}
                      `}>
                        {mod.subtitle}
                      </p>
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 flex-1">
                      {mod.desc}
                    </p>

                    {/* Footer */}
                    <div className={`
                      flex items-center justify-between pt-4 border-t transition-colors duration-300
                      ${isDisabled() ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800 group-hover:border-zinc-200 dark:group-hover:border-zinc-700'}
                    `}>
                      <div className={`
                        flex items-center text-sm font-bold transition-all duration-300
                        ${isDisabled() ? 'text-zinc-400 dark:text-yellow-700' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-white'}
                      `}>
                        {isDisabled() ? (
                          <><ShieldAlert size={16} className="mr-2" /> ACCESS DENIED</>
                        ) : (
                          <>
                            <Zap size={16} className="mr-2 group-hover:text-yellow-500 transition-colors" />
                            INITIALIZE
                            <ChevronRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="mt-auto pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
              <span className="text-zinc-600 dark:text-zinc-500">SYSTEM SECURE</span>
              <span className="text-zinc-400 dark:text-zinc-700">•</span>
              <span className="text-zinc-500 dark:text-zinc-500">AES-256</span>
            </div>
            <div className="text-zinc-500 dark:text-zinc-600">
               RRAFPROJECT-SEC-V1.0 <span className="mx-2">||</span> {new Date().getFullYear()}
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}