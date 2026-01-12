"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Cpu, 
  Activity, 
  Microscope, 
  Smartphone,
  Wrench,
  AlertTriangle
} from "lucide-react";
import CekNota from "@/components/CekNota";
import { useTheme } from "next-themes";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function GloryServicesPage() {
  const {theme } = useTheme();

   // --- DATA SPONSOR ---
  const brands = [
  { name: "VIVAN", color: "hover:text-blue-500" },
  { name: "UGREEN", color: "hover:text-green-500" },
  { name: "ROBOT", color: "hover:text-sky-500" },
  { name: "ORAIMO", color: "hover:text-teal-400" },
  { name: "MEETOO", color: "hover:text-purple-500" },
  { name: "SUNSHINE", color: "hover:text-yellow-500" }, // Anak servis pasti tau ini wkwk
  { name: "POZI", color: "hover:text-red-500" },
 ];
  const marqueeBrands = [...brands, ...brands]; 


  // --- DATA EXPERTISE ---
  const expertise = [
    {
      title: "Micro-Soldering",
      desc: "Perbaikan tingkat komponen mesin (IC) dengan mikroskop presisi tinggi. Solusi untuk HP mati total atau korslet.",
      icon: Microscope
    },
    {
      title: "Screen Reconditioning",
      desc: "Teknologi pemisahan kaca LCD canggih. Ganti kaca retak tanpa ganti LCD utuh (tetap original).",
      icon: Smartphone
    },
    {
      title: "Software & Unlock",
      desc: "Flashing, Bypass FRP, Unlock Jaringan, dan pemulihan data (Bootloop/Stuck Logo).",
      icon: Cpu
    }
  ];

  // --- DATA WORKFLOW ---
  const workflow = [
    { step: "01", title: "Diagnosa", desc: "Pengecekan menyeluruh menggunakan alat ukur digital (Amperemeter/Schematics)." },
    { step: "02", title: "Estimasi", desc: "Pemberian info kerusakan, biaya, dan resiko secara transparan kepada klien." },
    { step: "03", title: "Eksekusi", desc: "Proses perbaikan oleh teknisi bersertifikasi dengan SOP ketat." },
    { step: "04", title: "QC Final", desc: "Quality Control berlapis sebelum unit diserahkan kembali." }
  ];

  return (
    <div className="min-h-screen">
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed w-full z-50 backdrop-blur-md border-b transition-colors duration-300 bg-background/80`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-gray-500 hover:text-orange-500 transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Kembali</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <h1 className="font-bold text-xl tracking-tight">GLORY<span className="text-orange-500">SERVICES</span></h1>
            </div>
            <ThemeSwitcher /> 
          </div>
        </div>
      </nav>

            {/* --- HERO SECTION (THE LAB VIBES) --- */}
            <section className="pt-32 pb-20 px-4 relative overflow-hidden">
              {/* Tech Grid Background */}
              <div className={`absolute inset-0 z-0 opacity-[0.03] pointer-events-none ${theme === 'dark' ? 'bg-grid-white' : 'bg-grid-black'}`} 
                   style={{ backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
              />
              
              <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                  
                  {/* Left Content */}
                  <motion.div 
                    className="lg:w-1/2"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-orange-500/30 bg-orange-500/10 text-orange-500 text-xs font-mono mb-6">
                      <Activity size={14} />
                      SYSTEM STATUS: ONLINE
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-none tracking-tighter">
                      HARDWARE <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                        REHABILITATION.
                      </span>
                    </h1>
                    
                    <p className={`text-xl mb-8 leading-relaxed font-light ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Pusat perbaikan gadget dengan standar laboratorium. Kami tidak sekadar mengganti part, 
                      tapi mendiagnosa akar masalah dengan presisi teknis.
                    </p>
      
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => document.getElementById('cek-nota')?.scrollIntoView({ behavior: 'smooth' })} // Nembak ke component CekNota nanti
                        className="px-8 py-4 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Activity size={20} />
                        Diagnosa Gadget Saya
                      </button>
                      <div className="px-8 py-4 border border-gray-500/30 rounded-lg flex items-center justify-center gap-3">
                        <div className="flex -space-x-3">
                           {/* Dummy Avatars of Technicians */}
                           <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900"></div>
                           <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-900"></div>
                           <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-gray-900"></div>
                        </div>
                        <span className="text-sm font-medium">Ditangani Ahli</span>
                      </div>
                    </div>
                  </motion.div>
      
                  {/* Right Content: Abstract Tech Illustration */}
                  <motion.div 
                    className="lg:w-1/2 w-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div className={`relative aspect-square rounded-2xl border-2 overflow-hidden flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100 border-gray-300'}`}>
                      {/* Decoration Circles */}
                      <div className="absolute w-[80%] h-[80%] border border-orange-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                      <div className="absolute w-[60%] h-[60%] border border-dashed border-gray-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                      
                      {/* Center Icon */}
                      <div className="relative z-10 text-center">
                         <Cpu size={80} className={`${theme === 'dark' ? 'text-orange-500' : 'text-orange-600'} mx-auto mb-4`} />
                         <div className="font-mono text-sm tracking-widest opacity-50">DIAGNOSTIC MODE</div>
                      </div>
      
                      {/* Floating Tags */}
                      <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute top-10 right-10 bg-gray-800 text-green-400 px-4 py-2 rounded text-xs font-mono border border-green-500/30 shadow-lg"
                      >
                        QC: PASSED
                      </motion.div>
                      <motion.div 
                         animate={{ y: [0, 10, 0] }}
                         transition={{ duration: 4, repeat: Infinity }}
                         className="absolute bottom-10 left-10 bg-gray-800 text-orange-400 px-4 py-2 rounded text-xs font-mono border border-orange-500/30 shadow-lg"
                      >
                        TEMP: 35°C
                      </motion.div>
                    </div>
                  </motion.div>
      
                </div>
              </div>
            </section>
      
            {/* --- STATS BAR (THE TRUST) --- */}
            <section className={`border-y ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  {[
                    { label: "Unit Diperbaiki", val: "5,000+" },
                    { label: "Tahun Pengalaman", val: "7+" },
                    { label: "Garansi Service", val: "30 Hari" },
                    { label: "Success Rate", val: "98%" },
                  ].map((stat, idx) => (
                    <div key={idx} className="space-y-1">
                      <h3 className="text-3xl md:text-4xl font-black text-orange-500">{stat.val}</h3>
                      <p className={`text-sm font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
      
            {/* --- TECHNICAL EXPERTISE --- */}
            <section className="py-24 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                  <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                    <Wrench className="text-orange-500" />
                    Technical Capabilities
                  </h2>
                  <div className="h-1 w-20 bg-gray-700 rounded-full" />
                </div>
      
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {expertise.map((item, idx) => (
                    <div key={idx} className={`p-8 rounded-xl border transition-all hover:border-orange-500/50 group ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                      <div className="w-16 h-16 bg-orange-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors text-orange-500">
                        <item.icon size={32} />
                      </div>
                      <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
      
            {/* --- THE WORKFLOW (PROCESS) --- */}
            <section className={`py-24 px-4 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <span className="text-orange-500 font-mono text-sm tracking-widest">STANDARD OPERATING PROCEDURE</span>
                  <h2 className="text-3xl md:text-4xl font-bold mt-2">Alur Perbaikan</h2>
                </div>
      
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {workflow.map((flow, idx) => (
                    <div key={idx} className="relative">
                      {/* Connector Line (Desktop Only) */}
                      {idx !== workflow.length - 1 && (
                        <div className={`hidden md:block absolute top-8 left-1/2 w-full h-0.5 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`} />
                      )}
                      
                      <div className={`relative z-10 p-6 rounded-xl border text-center h-full transition-transform hover:-translate-y-2 ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200 shadow-md'}`}>
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold mb-6 border-4 ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-orange-500' : 'bg-gray-50 border-gray-100 text-orange-600'}`}>
                          {flow.step}
                        </div>
                        <h3 className="text-lg font-bold mb-2">{flow.title}</h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                          {flow.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
      
            {/* --- WARNING / INFO --- */}
            <section className="py-12 px-4">
              <div className="max-w-5xl mx-auto">
                 <div className={`rounded-xl p-8 border border-l-4 flex flex-col md:flex-row gap-6 items-start ${theme === 'dark' ? 'bg-yellow-900/10 border-yellow-500/50 border-l-yellow-500' : 'bg-yellow-50 border-yellow-200 border-l-yellow-500'}`}>
                    <AlertTriangle className="text-yellow-500 shrink-0" size={40} />
                    <div>
                       <h3 className="text-lg font-bold text-yellow-500 mb-2">Penting Untuk Diketahui</h3>
                       <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Kami sangat menjaga privasi data user. Namun, untuk perbaikan software (Install Ulang/Flashing), 
                          data pada device berpotensi hilang. Mohon lakukan backup data sebelum menyerahkan unit jika memungkinkan.
                          Keamanan data hardware (tidak ditukar-tukar) adalah jaminan mutlak kami.
                       </p>
                    </div>
                 </div>
              </div>
            </section>
      
            {/* --- MARQUEE SPONSOR BRANDS --- */}
           <section className={`py-10 border-y overflow-hidden ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="max-w-7xl mx-auto px-4 mb-6 text-center">
                <p className={`text-sm font-bold tracking-widest uppercase ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  Authorized Reseller & Trusted Partner
                </p>
              </div>
      
              {/* Marquee Container */}
              <div className="relative flex overflow-hidden group">
                
                {/* Gradients di Kiri & Kanan (Biar logonya muncul/ilang pelan-pelan) */}
                <div className={`absolute top-0 left-0 w-24 h-full z-10 bg-gradient-to-r ${theme === 'dark' ? 'from-gray-900 to-transparent' : 'from-gray-50 to-transparent'}`} />
                <div className={`absolute top-0 right-0 w-24 h-full z-10 bg-gradient-to-l ${theme === 'dark' ? 'from-gray-900 to-transparent' : 'from-gray-50 to-transparent'}`} />
      
                {/* The Moving Track */}
                <motion.div
                  className="flex gap-16 items-center whitespace-nowrap"
                  animate={{ x: ["0%", "-50%"] }} // Gerak dari 0 ke -50% (setengah panjang total)
                  transition={{
                    repeat: Infinity, // Ulang terus
                    ease: "linear", // Geraknya rata (gak ada ngerem)
                    duration: 20, // Kecepatan (makin gede makin pelan)
                  }}
                >
                  {marqueeBrands.map((brand, idx) => (
                    <div 
                      key={idx} 
                      className={`text-3xl md:text-4xl font-black italic tracking-tighter transition-colors duration-300 cursor-default select-none ${theme === 'dark' ? 'text-gray-800' : 'text-gray-300'} ${brand.color}`}
                    >
                      {/* Nanti kalo udah ada LOGO PNG, ganti text ini pake <Image src={...} /> */}
                      {brand.name}
                    </div>
                  ))}
                </motion.div>
              </div>
            </section>
      
            {/* --- PLACEHOLDER CEK NOTA --- */}
            <div id="cek-nota" className="py-10 text-center border-t border-dashed border-gray-700">
               <CekNota />
            </div>


      {/* --- FOOTER --- */}
      <footer className={`py-8 text-center border-t transition-colors duration-300 bg-background/80`}>
        <p className="text-sm font-mono">
          GLORY SERVICES. ENGINEERING DIVISION. <br/>
          Part of <span className="text-orange-500">rrafproject</span> ecosystem.
        </p>
      </footer>

    </div>
  );
}