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
          return { title: "Captain", color: "text-red-500", glow: "shadow-red-500/50" };
        case "moderator":
          return { title: "Officer", color: "text-blue-500", glow: "shadow-blue-500/50" };
        case "frontliner":
          return { title: "Crew", color: "text-green-500", glow: "shadow-green-500/50" };
        default:
          return { title: "User", color: "text-gray-500", glow: "shadow-gray-500/50" };
      }
    }; 
  
    const userInfo = await UserDetails();
    const userRole = (userInfo as JwtPayload).app_metadata?.role || 'user';
    const greeting = getGreeting((userInfo as JwtPayload).app_metadata?.role) || 'user'

  return (
    <main className="min-h-screen bg-black text-gray-200 font-sans selection:bg-gray-700 selection:text-white relative overflow-hidden">
      {/* --- ENHANCED SPACE BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Animated Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_100%)] animate-[pulse_4s_ease-in-out_infinite]" />
         
         {/* Multiple Radial Glows */}
         <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] animate-pulse" />
         <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] animate-pulse delay-1000" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gray-900/20 rounded-full blur-[140px]" />
         
         {/* Floating Particles */}
         <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${10 + Math.random() * 20}s`,
                }}
              />
            ))}
         </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen">
        {/* ENHANCED HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 md:gap-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Enhanced Avatar */}
            <div className="relative group">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${greeting.color === 'text-red-500' ? 'from-red-500' : greeting.color === 'text-blue-500' ? 'from-blue-500' : 'from-green-500'} to-transparent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
              <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 border-2 ${greeting.color === 'text-red-500' ? 'border-red-500/30' : greeting.color === 'text-blue-500' ? 'border-blue-500/30' : 'border-green-500/30'} flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${greeting.glow}`}>
                <UserCircle size={32} className={`${greeting.color} transition-transform duration-300 group-hover:scale-110`} />
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs md:text-sm font-mono text-gray-500 uppercase tracking-widest">
                  Welcome Aboard
                </p>
                <Sparkles size={12} className={`${greeting.color} animate-pulse`} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex flex-wrap items-center gap-2">
                <span className={`${greeting.color} font-extrabold tracking-tight`}>
                  {greeting.title}
                </span>
                <span className="text-gray-400">
                  {userInfo.email?.slice(0, userInfo.email.indexOf("@"))}
                </span>
              </h1>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                  {userInfo.app_metadata?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 p-2">
            <Link href={'/fl/dashboard/settings'} passHref>
              <Button variant="outline" className="group border-gray-700 bg-gray-900/50 hover:bg-gray-800 hover:border-gray-600 transition-all duration-300 backdrop-blur-sm">
                <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                <span className="hidden md:inline ml-2">Settings</span>
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col justify-center">
          {/* Section Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <Terminal size={18} className="text-cyan-400" />
              <span className="text-sm font-mono text-gray-400 uppercase tracking-wider">
                Select Module to Initialize
              </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-800 to-transparent" />
          </div>

          {/* Enhanced Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            {ModuleMenus.map((mod, idx) => {
                const isDisabled = () => {
                  if (userRole === 'admin') return false;

                  const permissions:{frontliner: string[];moderator: string[]; user: string[]} = {
                    frontliner: ['bank', 'service'],
                    moderator: ['treasury', 'bank', 'service'],
                    user: []
                  };

                  const allowedMenus = permissions[userRole as keyof typeof permissions] || [];
                  const isAllowed = allowedMenus.includes(mod.id);

                  return !isAllowed;
                };
              return(
              <Link 
                key={mod.id} 
                href={isDisabled() ? '#' : mod.href}
                className={`block h-full ${isDisabled() ? 'cursor-not-allowed' : ''}`}
                aria-disabled={isDisabled()}
              >
                <div 
                  className={`
                    group relative h-full p-6 md:p-8 rounded-2xl border backdrop-blur-sm
                    transition-all duration-500 overflow-hidden
                    ${isDisabled()
                      ? 'bg-gray-950/30 border-yellow-900/30 border-dashed' 
                      : `bg-gray-950/50 border-gray-800 ${mod.accent} hover:scale-[1.02] hover:shadow-2xl`
                    }
                  `}
                  style={{
                    animationDelay: `${idx * 100}ms`
                  }}
                >
                  {/* Animated Background Gradient */}
                  {!isDisabled() && (
                    <>
                      <div className={`absolute inset-0 bg-gradient-to-br ${mod.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {/* Shine Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      </div>
                    </>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-6">
                      {/* Icon */}
                      <div className={`
                        relative p-4 rounded-xl border transition-all duration-300
                        ${isDisabled()
                          ? 'bg-yellow-900/10 border-yellow-900/30 text-yellow-700' 
                          : `${mod.iconBg} group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg`
                        }
                      `}>
                        {!isDisabled() && (
                          <div className={`absolute inset-0 rounded-xl ${mod.iconBg} blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                        )}
                        <mod.icon size={28} className={`relative ${isDisabled() ? 'text-yellow-700' : mod.iconColor}`} />
                      </div>

                      {/* Status Badge */}
                      <div className={`
                        flex items-center gap-2 text-[10px] font-mono uppercase border px-3 py-1.5 rounded-full
                        transition-all duration-300
                        ${isDisabled()
                          ? 'border-yellow-900/30 bg-yellow-900/10 text-yellow-600' 
                          : 'border-gray-700 bg-black/40 text-gray-400 group-hover:border-gray-600 backdrop-blur-sm'
                        }
                      `}>
                        {!isDisabled() && (
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                        )}
                        {mod.stat}
                      </div>
                    </div>

                    {/* Title Section */}
                    <div className="mb-4">
                      <h3 className={`
                        text-2xl font-bold mb-2 tracking-tight transition-colors duration-300
                        ${isDisabled()
                          ? 'text-gray-600' 
                          : 'text-gray-100 group-hover:text-white'
                        }
                      `}>
                        {mod.title}
                      </h3>
                      <p className={`
                        text-xs font-bold tracking-widest uppercase transition-colors duration-300
                        ${isDisabled() 
                          ? 'text-yellow-700/70' 
                          : `text-gray-500 ${mod.textAccent}`
                        }
                      `}>
                        {mod.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">
                      {mod.desc}
                    </p>

                    {/* Action Footer */}
                    <div className={`
                      flex items-center justify-between pt-4 border-t transition-colors duration-300
                      ${isDisabled()
                        ? 'border-yellow-900/20' 
                        : 'border-gray-800 group-hover:border-gray-700'
                      }
                    `}>
                      <div className={`
                        flex items-center text-sm font-bold transition-all duration-300
                        ${isDisabled()
                          ? 'text-yellow-700' 
                          : 'text-gray-500 group-hover:text-white'
                        }
                      `}>
                        {isDisabled() ? (
                          <>
                            <ShieldAlert size={16} className="mr-2" />
                            ACCESS DENIED
                          </>
                        ) : (
                          <>
                            <Zap size={16} className="mr-2 group-hover:text-yellow-400 transition-colors" />
                            INITIALIZE MODULE
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

        {/* ENHANCED FOOTER */}
        <footer className="mt-auto pt-8 border-t border-gray-900/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono">
            {/* System Status */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
              </div>
              <span className="text-gray-500">SYSTEM SECURE</span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-500">ENCRYPTION: AES-256</span>
            </div>

            {/* Version Info */}
            <div className="text-gray-600">
              <span className="text-gray-700">REF:</span> RRAFPROJECT-SEC-V1.0 
              <span className="text-gray-800 mx-2">||</span> 
              {new Date().getFullYear()}
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}