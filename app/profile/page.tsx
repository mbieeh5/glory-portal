"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone, 
  ShieldCheck, 
  ThumbsUp, 
  Users, 
  ChevronRight,
  Smartphone,
  Cpu,
  ShoppingBag
} from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function StoreProfilePage() {
  const {theme} = useTheme();


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


  // --- DATA CABANG ---
  const branches = [
    {
      id: 1,
      name: "Glory Part Station 1 (Cab. Cikaret)",
      address: "Jl. Cikaret No 02B-C, Kel Harapan Jaya, Kec Cibinong, Kab Bogor",
      mapUrl: "https://maps.app.goo.gl/geJXhoaoWWXmTiK68",
      phone: "0881-1429-638",
      status: "Buka",
      hours: "09:00 - 21:30 WIB"
    },
    {
      id: 2,
      name: "Glory Part Station 2 (Cab. Sukahati)",
      address: "Jl. Ksr Dadi Kusmayadi No 01, Kel Tengah, Kec Cibinong, Kab Bogor",
      mapUrl: "https://maps.app.goo.gl/yScXYPivacrLnv6e9",
      phone: "089-7399-7575",
      status: "Buka",
      hours: "09:00 - 21:30 WIB"
    },
    {
      id: 3,
      name: "Glory Part Station 3 (Cab. ????????)",
      address: "Coming Soon...",
      mapUrl: "https://maps.google.com",
      phone: "-",
      status: "Segera Hadir",
      hours: "??:?? - ??:?? WIB"
    }
  ];

  // --- DATA LAYANAN ---
  const services = [
    {
      title: "Retail & Aksesoris",
      desc: "Menyediakan aksesoris gadget terlengkap dan kekinian. Case, charger, audio, hingga pelindung layar premium.",
      icon: ShoppingBag
    },
    {
      title: "Grosir Sparepart",
      desc: "Pusat kulakan teknisi. LCD, Baterai, Flexible, dan IC berkualitas dengan harga khusus untuk pengambilan partai.",
      icon: Cpu
    },
    {
      title: "Service Hardware & Software",
      desc: "Perbaikan HP mati total, ganti kaca, unlock jaringan, hingga masalah software ditangani teknisi berpengalaman.",
      icon: Smartphone
    }
  ];

  return (
    <div className={theme === "dark" ? "min-h-screen bg-gray-900 text-gray-100 font-sans" : "min-h-screen bg-gray-50 text-gray-900 font-sans"}>
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed w-full z-50 backdrop-blur-md border-b transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-gray-500 hover:text-orange-500 transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Kembali</span>
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-xl tracking-tight">GLORY<span className="text-orange-500">CELL</span></h1>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

            {/* --- HERO SECTION (ABOUT US) --- */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Abstract Background */}
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px] -z-10`} />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-orange-500 font-bold tracking-wider uppercase text-sm mb-2 block">Tentang Kami</span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Lebih Dari Sekadar <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Toko Handphone.</span>
            </h1>
            <p className={`text-lg mb-8 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Glory Cell hadir sebagai solusi *one-stop solution* untuk kebutuhan digital Anda. 
              Mulai dari aksesoris gaya hidup, suplai sparepart untuk teknisi, hingga perbaikan gadget dengan standar profesional.
              Kami mengutamakan kualitas, kecepatan, dan kepercayaan.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#lokasi" className="px-8 py-3 bg-orange-600 text-white rounded-full font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30">
                Kunjungi Toko
              </a>
              <a href="https://wa.me/6281234567890" target="_blank" className={`px-8 py-3 rounded-full font-bold border transition-colors ${theme === 'dark' ? 'border-gray-700 hover:border-gray-500 text-white' : 'border-gray-300 hover:border-gray-900 text-gray-900'}`}>
                Hubungi Kami
              </a>
            </div>
          </motion.div>

          {/* Image / Illustration Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`aspect-video rounded-3xl flex items-center justify-center relative border-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
          >
             {/* Ganti div ini dengan <Image /> asli nanti */}
            <div className="text-center">
               <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-10 h-10 text-orange-600" />
               </div>
               <p className="text-gray-500 font-medium">Foto Toko / Showcase Disini</p>
            </div>
          </motion.div>
        </div>
      </section>

    {/* --- SPONSOR / PARTNER MARQUEE --- */}
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

      {/* --- VALUE PROPOSITION (KENAPA GLORY?) --- */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Kenapa Memilih Glory Cell?</h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "Produk Original", desc: "Jaminan keaslian untuk setiap aksesoris dan sparepart yang kami jual." },
              { icon: ThumbsUp, title: "Harga Kompetitif", desc: "Harga eceran bersahabat, harga grosir yang menguntungkan buat bakul." },
              { icon: Users, title: "Pelayanan Ramah", desc: "Staff kami siap membantu memberikan rekomendasi terbaik untuk gadgetmu." },
            ].map((item, idx) => (
              <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className={`p-8 rounded-2xl text-center transition-all ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white shadow-lg'}`}
              >
                <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center mb-6 text-orange-500">
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SERVICES (KITA NGAPAIN AJA) --- */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <span className="text-orange-500 font-bold tracking-wider uppercase text-sm">Layanan Kami</span>
              <h2 className="text-3xl font-bold mt-2">Apa yang Kami Tawarkan?</h2>
            </div>
            <Link href="/services" className="hidden md:flex items-center text-orange-500 font-semibold hover:gap-2 transition-all mt-4 md:mt-0">
              Cek Status Servis <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((srv, idx) => (
              <div key={idx} className={`group p-8 rounded-3xl border transition-all duration-300 hover:border-orange-500 relative overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  <srv.icon size={120} />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-orange-500/20">
                    <srv.icon size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{srv.title}</h3>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                    {srv.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/tracking" className="inline-flex items-center text-orange-500 font-semibold">
              Cek Status Servis <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* --- LOCATIONS (KITA DIMANA) --- */}
      <section id="lokasi" className={`py-20 ${theme === 'dark' ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-50 border-t border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Temukan Kami</h2>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Silakan kunjungi cabang terdekat dari lokasi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {branches.map((branch) => (
              <div key={branch.id} className={`rounded-3xl p-1 overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-xl'}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold">{branch.name}</h3>
                    <div className={`${branch.status === "Buka" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"} px-3 text-center py-1 rounded-full text-xs font-bold uppercase border border-green-500/20`}>
                      {branch.status}
                    </div>
                  </div>
                  
                  <div className="space-y-4 pb-4">
                    <div className="flex items-start gap-4">
                      <MapPin className="text-orange-500 shrink-0 mt-1" size={20} />
                      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{branch.address}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Clock className="text-orange-500 shrink-0" size={20} />
                      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{branch.hours}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Phone className="text-orange-500 shrink-0" size={20} />
                      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{branch.phone}</p>
                    </div>
                  </div>

                  <a 
                    href={branch.mapUrl} 
                    target="_blank" 
                    className="mt-8 flex items-center justify-center w-full py-3 rounded-xl border-2 border-dashed border-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors font-medium gap-2"
                    >
                    <MapPin size={18} />
                    Lihat di Google Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> 

      {/* --- FOOTER --- */}
      <footer className={`py-8 text-center border-t ${theme === 'dark' ? 'border-gray-800 bg-gray-950 text-gray-500' : 'border-gray-200 bg-white text-gray-400'}`}>
        <p className="text-sm">
          &copy; 2026 Glory Cell. Member of <span className="font-bold text-orange-500">rrafproject</span> ecosystem.
        </p>
      </footer>

    </div>
  );
}