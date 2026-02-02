// ==========================================
// 🛠️ SERVICE DUNGEON MENUS
// ==========================================
export const serviceMenus = {
  // Role: FRONTLINER
  frontliner: [
    { label: 'Dashboard', href: '/fl/dashboard/service', icon: "LayoutDashboard" }, // Dashboard Utama untuk user
    { label: 'Input Servis', href: '/fl/dashboard/service/input', icon: "Wrench" }, // Halaman Input Services
    { label: 'Data Harian', href: '/fl/dashboard/service/daily', icon: "Calendar" }, // Halaman untuk melihat data service harian
    { label: 'Update', href: '/fl/dashboard/service/update/', icon: "Search" }, // Halaman untuk mengUpdate data service
    { label: 'Cek Data', href: '/fl/dashboard/service/check', icon: "Search" }, // Halaman Cek Status Service atau Tracking service
  ],
  
  // Role: MODERATOR
  moderator: [
    { label: 'Dashboard', href: '/fl/dashboard/service', icon: "LayoutDashboard" }, // Dashboard Utama untuk user
    { label: 'Data Harian', href: '/fl/dashboard/service/daily', icon: "Calendar" }, // Halaman untuk melihat data service harian
    { label: 'Update', href: '/fl/dashboard/service/update/', icon: "Search" }, // Halaman untuk mengUpdate data service
    { label: 'Cek Data', href: '/fl/dashboard/service/check', icon: "Search" }, // Halaman Cek Status lebih detail 
  ],
  
  // Role: ADMIN
  admin: [
    { label: 'Dashboard', href: '/fl/dashboard/service', icon: "LayoutDashboard" }, // Dashboard Utama untuk user
    { label: 'Cek Data', href: '/fl/dashboard/service/check', icon: "Search" }, // Halaman Cek Status Service atau Tracking service
    { label: 'Input Servis', href: '/fl/dashboard/service/input', icon: "Wrench" },  // Halaman Input Services
    { label: 'Update', href: '/fl/dashboard/service/update/', icon: "Search" }, // Halaman untuk mengUpdate data service
    { label: 'Master Data', href: '/fl/dashboard/service/daily', icon: "FileText" }, // Filter bulan, edit, cancel
    { label: 'Statistik Poin', href: '/fl/dashboard/service/statistik', icon: "Award" }, // Itung gaji crew
  ]
};


// ==========================================
// 🏦 BANK DUNGEON MENUS
// ==========================================
export const bankMenus = {
  // Role: FRONTLINER
  frontliner: [
    { label: 'Dashboard', href: '/fl/dashboard/bank', icon: "LayoutDashboard" }, // Dashboard utama untuk user
    { label: 'Transfer Hari Ini', href: '/fl/dashboard/bank/daily', icon: "ArrowRightLeft" }, // Halaman cek Mutasi perhari
    { label: 'Cetak Struk', href: '/fl/dashboard/bank/print', icon: "Printer" }, // Halaman cetak struk transfer
  ],

  // Role: MODERATOR (BLOCKED - Gak punya menu)
  moderator: [], 

  // Role: ADMIN
  admin: [
    { label: 'Dashboard', href: '/fl/dashboard/bank', icon: "LayoutDashboard" }, // Dashboard utama untuk user
    { label: 'Mutasi Lengkap', href: '/fl/dashboard/bank/mutations', icon: "History" }, // Halaman Cek mutasi lengkap atau *Master Data*
    { label: 'Kelola Saldo', href: '/fl/dashboard/bank/balance', icon: "Wallet" }, // Halaman untuk memindahkan Saldo atau Menambah saldo
    { label: 'Hitung Poin', href: '/fl/dashboard/bank/points', icon: "Award" }, // Halaman untuk menghitung point para crew
    { label: 'Cetak Struk', href: '/fl/dashboard/bank/print', icon: "Printer" }, // Halaman cetak struk transfer
  ]
};