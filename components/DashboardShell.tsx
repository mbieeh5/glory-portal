"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ChevronLeft, 
  Cpu,
  Banknote,
  ShieldCheck,
  LayoutDashboard,
  Wrench, 
  FileText, 
  History, 
  ArrowRightLeft, 
  Printer, 
  Wallet, 
  Award,
  Search,
  Calendar,
  Menu,
  X,
  FileSliders
} from "lucide-react";
import { useTheme } from "next-themes";
import { LogoutButton } from "./logout-button";
import { ThemeSwitcher } from "./theme-switcher";

// --- TIPE DATA PROPS ---
type MenuItem = {
  label: string;
  href: string;
  icon: string;
};

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  menuItems: MenuItem[];
  themeColor: 'orange' | 'cyan' | 'emerald' | 'yellow';
  userRole?: string;
}

export default function DashboardShell({ 
  children, 
  title, 
  subtitle = "System Module",
  menuItems, 
  themeColor,
  userRole = "Crew"
}: DashboardShellProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // State untuk collapse sidebar

  // --- MAPPING ICON DARI STRING KE COMPONENT ---
  // eslint-disable-next-line
  const iconMap: Record<string, any> = {
    LayoutDashboard, 
    Wrench, 
    FileText, 
    History,
    ArrowRightLeft, 
    Printer, 
    Wallet, 
    Award,
    Search,
    Calendar
  };

  // --- LOGIC WARNA DINAMIS ---
  const themeStyles = {
    orange: {
      text: 'text-orange-500',
      bgActive: 'bg-orange-500/10',
      borderActive: 'border-orange-500',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.1)]',
      iconColor: 'text-orange-500'
    },
    cyan: {
      text: 'text-cyan-500',
      bgActive: 'bg-cyan-500/10',
      borderActive: 'border-cyan-500',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.1)]',
      iconColor: 'text-cyan-500'
    },
    emerald: {
      text: 'text-emerald-500',
      bgActive: 'bg-emerald-500/10',
      borderActive: 'border-emerald-500',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]',
      iconColor: 'text-emerald-500'
    },
    yellow: {
      text: 'text-yellow-500',
      bgActive: 'bg-yellow-500/10',
      borderActive: 'border-yellow-500',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.1)]',
      iconColor: 'text-yellow-500'
    }
  };

  const currentTheme = themeStyles[themeColor];

  // useEffect biar gak error hydration (client vs server)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`
      min-h-screen transition-colors duration-300
      ${theme === 'dark' ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-900'}
    `}>
      
      {/* SIDEBAR (DESKTOP) */}
      <aside className={`
        hidden md:flex flex-col fixed h-full z-50 border-r backdrop-blur-xl transition-all duration-300
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
        ${theme === 'dark' ? 'bg-gray-950/50 border-gray-900' : 'bg-white/80 border-gray-200'}
      `}>
        
        {/* HEADER SIDEBAR */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200'}`}>
          
          {/* Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              mb-4 p-2 rounded-lg border transition-all duration-200
              ${theme === 'dark' 
                ? 'bg-gray-950/50 border-black text-gray-400 hover:text-white' 
                : 'bg-white/80 border-white text-gray-600 hover:text-gray-900'
              }
              ${sidebarCollapsed ? 'w-full' : 'w-full flex justify-end'}
            `}
          >
            {sidebarCollapsed ? <Menu size={16} /> : <X size={16} />}
          </button>

          {!sidebarCollapsed && (
            <>
              <Link href="/fl/dashboard" className={`flex items-center gap-2 transition-colors mb-6 text-xs font-mono group ${
                theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
                RETURN TO PORTAL
              </Link>
              <div className="flex items-center gap-3 mb-1">
                <div className={`p-2 rounded border ${
                  theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-300 bg-gray-100'
                } ${currentTheme.text}`}>
                  { title.includes("Bank") && <Banknote size={20} /> }
                  { (title.includes("Admin") || title.includes("Captain"))}
                  { title.includes("Rekap") && <FileText size={20} /> }
                  { title.includes('Cockpit') && <FileSliders size={20} />}
                  { title.includes("Service") && <Cpu size={20} /> }
                </div>
                <div>
                  <h1 className={`font-black text-lg tracking-wider leading-none ${currentTheme.text}`}>
                    {title}
                  </h1>
                  <p className={`text-[10px] font-mono uppercase tracking-widest mt-1 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {subtitle}
                  </p>
                </div>
              </div>
              
              {/* TOMBOL TOGGLE THEME (SIDEBAR) */}
              <div className={'m-1 pt-4'}>
                  <ThemeSwitcher />
              </div>
            </>
          )}

          {/* Collapsed State - Only show icon */}
          {sidebarCollapsed && (
            <div className="flex flex-col items-center gap-4">
              <div className={`p-2 rounded border ${
                theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-300 bg-gray-100'
              } ${currentTheme.text}`}>
                { title.includes("bank") && <Banknote size={20} /> }
                { (title.includes("admin") || title.includes("captain"))}
                { title.includes("rekap") && <FileText size={20} /> }
                { title.includes("service") && <Cpu size={20} /> }
              </div>
             <ThemeSwitcher />
            </div>
          )}
        </div>

        {/* MENU LIST */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {!sidebarCollapsed && (
            <p className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
            }`}>Navigation</p>
          )}
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = iconMap[item.icon];
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 font-medium text-sm
                  ${sidebarCollapsed ? 'justify-center' : ''}
                  ${isActive 
                    ? `${currentTheme.bgActive} ${currentTheme.text} ${currentTheme.borderActive} ${currentTheme.glow}` 
                    : theme === 'dark'
                      ? 'hover:bg-gray-900 text-gray-400 hover:text-gray-200 border-transparent hover:border-gray-800'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                  }
                `}
                title={sidebarCollapsed ? item.label : ''}
              >
                {IconComponent && <IconComponent size={18} className={isActive ? currentTheme.text : ''} />}
                {!sidebarCollapsed && item.label}
                {isActive && !sidebarCollapsed && (
                  <div className={`ml-auto w-1.5 h-1.5 rounded-full ${currentTheme.text.replace('text', 'bg')} animate-pulse`} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* FOOTER SIDEBAR */}
        <div className={`p-4 border-t ${
          theme === 'dark' ? 'border-gray-900 bg-gray-950/80' : 'border-gray-200 bg-gray-50'
        }`}>
          {!sidebarCollapsed && (
            <>
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'
                }`}>
                  <ShieldCheck size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Logged In
                  </p>
                  <p className={`text-xs truncate font-mono ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                    {userRole}
                  </p>
                </div>
              </div>
              <LogoutButton />
            </>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 pb-24 md:pb-8 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}> 
        
        {/* MOBILE HEADER */}
        <div className={`
          md:hidden sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center
          ${theme === 'dark' ? 'bg-black/80 border-gray-900' : 'bg-white/80 border-gray-200'}
        `}>
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded border ${
              theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-300 bg-gray-100'
            } ${currentTheme.text}`}>
              <Cpu size={18} />
            </div>
            <h1 className={`font-bold text-sm tracking-wide ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}>{title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* TOGGLE THEME (MOBILE) */}
           <ThemeSwitcher />

            {/* Tombol Logout */}
            <LogoutButton />
          </div>
        </div>

        {/* CONTENT CHILDREN */}
        <div className="p-4 md:p-8 md:pt-10 w-full mx-auto animate-in fade-in background-blur-xl duration-500 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* BOTTOM NAVIGATION (MOBILE) - SCROLLABLE */}
      <nav className={`
        md:hidden fixed bottom-0 w-full border-t z-50 backdrop-blur-xl overflow-x-auto
        ${theme === 'dark' ? 'bg-black/90 border-gray-900' : 'bg-white/90 border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]'}
      `}>
        <div className="flex justify-center items-center h-16 px-2 min-w-max">
          
          {/* Back to Portal */}
          <Link 
            href="/fl/dashboard" 
            className={`flex flex-col items-center justify-center min-w-[70px] h-full space-y-1 ${
              theme === 'dark' ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChevronLeft size={20} />
            <span className="text-[9px] font-mono uppercase">Portal</span>
          </Link>

          {/* Mapped Menus - ALL MENUS */}
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = iconMap[item.icon];
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center min-w-[70px] h-full space-y-1 transition-all
                  ${isActive ? currentTheme.text : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
                `}
              >
                <div className={`relative ${isActive ? '-translate-y-1' : ''} transition-transform`}>
                  {IconComponent && <IconComponent size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />}
                  {isActive && (
                    <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${currentTheme.text.replace('text', 'bg')}`} />
                  )}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  );
}