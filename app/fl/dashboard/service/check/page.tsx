'use client'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  FileText,
  User,
  Phone,
  Smartphone,
  MapPin,
  MessageSquare,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Package,
  Ban,
  Wrench,
  ClipboardList,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { ServiceTransaction } from '@/config/type';
import CheckDataSatuanService from '@/lib/services/checkDataSatuan.services';

export default function CheckDashboardPage() {
  const [invoiceId, setInvoiceId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<ServiceTransaction | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setNotFound(false);
    setSearchResult(null);
    
    if(!invoiceId.trim()){
      setIsSearching(false);
      setNotFound(true);
      return
    }
    
    const SingleData = await CheckDataSatuanService(invoiceId)

    if(SingleData){
      setSearchResult(SingleData);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
    
    setIsSearching(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (datetime: string | null) => {
    if (!datetime) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(datetime));
  };

  // Status Badge Component
  const getStatusBadge = (status: 'in_process' | 'completed' | 'canceled') => {
    const statusConfig = {
      in_process: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        border: 'border-yellow-300 dark:border-yellow-700',
        text: 'text-yellow-900 dark:text-yellow-300',
        icon: <Clock className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />,
        label: 'Dalam Proses'
      },
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-300 dark:border-green-700',
        text: 'text-green-900 dark:text-green-300',
        icon: <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" />,
        label: 'Selesai'
      },
      canceled: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-300 dark:border-red-700',
        text: 'text-red-900 dark:text-red-300',
        icon: <Ban className="w-5 h-5 text-red-700 dark:text-red-400" />,
        label: 'Dibatalkan'
      },
    };

    const config = statusConfig[status];

    return (
      <div className={`flex items-center gap-2 px-4 py-2 ${config.bg} border ${config.border} rounded-lg`}>
        {config.icon}
        <span className={`font-semibold ${config.text}`}>
          {config.label}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                Check Transaction
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Cari data transaksi servis berdasarkan invoice
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 mb-6"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Invoice ID
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white font-mono"
                    placeholder="Contoh: GL0000ABC"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isSearching}
                  whileHover={{ scale: isSearching ? 1 : 1.02 }}
                  whileTap={{ scale: isSearching ? 1 : 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 dark:from-orange-500 dark:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="hidden sm:inline">Mencari...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span className="hidden sm:inline">Cari</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Not Found Message */}
        <AnimatePresence>
          {notFound && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6"
            >
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                    Data Tidak Ditemukan
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Invoice ID <span className="font-mono font-semibold">{invoiceId}</span> tidak ditemukan dalam sistem.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Result */}
        <AnimatePresence>
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                {getStatusBadge(searchResult.status)}
              </div>

              {/* Main Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-700 dark:to-orange-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {searchResult.customers_info?.customer_name || 'N/A'}
                      </h2>
                      <p className="text-orange-100">
                        Invoice: <span className="font-mono font-semibold">{searchResult.invoice_id}</span>
                      </p>
                    </div>
                    <Receipt className="w-12 h-12 text-orange-200" />
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Customer Info Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Informasi Pelanggan
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem
                        icon={<User className="w-5 h-5" />}
                        label="Customer ID"
                        value={searchResult.customer_id}
                        mono
                      />
                      <InfoItem
                        icon={<User className="w-5 h-5" />}
                        label="Nama Pelanggan"
                        value={searchResult.customers_info?.customer_name || '-'}
                      />
                      <InfoItem
                        icon={<Phone className="w-5 h-5" />}
                        label="Nomor HP Pelanggan"
                        value={searchResult.customers_info?.customer_phone_number || '-'}
                        mono
                      />
                      <InfoItem
                        icon={<User className="w-5 h-5" />}
                        label="Nama Penerima"
                        value={searchResult.recipient_name}
                      />
                    </div>
                  </div>

                  {/* Device Info Section */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <Smartphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Informasi Perangkat
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem
                        icon={<Phone className="w-5 h-5" />}
                        label="Merk HP"
                        value={searchResult.phone_brand}
                      />
                      <InfoItem
                        icon={<Smartphone className="w-5 h-5" />}
                        label="IMEI"
                        value={searchResult.phone_imei || '-'}
                        mono
                      />
                    </div>
                  </div>

                  {/* Service Details Section */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Detail Servis
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <InfoItem
                        icon={<Calendar className="w-5 h-5" />}
                        label="Tanggal Masuk"
                        value={formatDateTime(searchResult.entry_datetime)}
                      />
                      <InfoItem
                        icon={<MapPin className="w-5 h-5" />}
                        label="Lokasi Servis"
                        value={searchResult.location}
                      />
                      <InfoItem
                        icon={<User className="w-5 h-5" />}
                        label="Teknisi"
                        value={searchResult.technician}
                      />
                      {searchResult.technicial_fee !== null && (
                        <InfoItem
                          icon={<DollarSign className="w-5 h-5" />}
                          label="Biaya Teknisi"
                          value={formatCurrency(searchResult.technicial_fee || 0)}
                        />
                      )}
                    </div>

                    {/* Complaint */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            Kondisi
                          </h4>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {searchResult.complaint}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Treatment */}
                    {searchResult.treatment && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg mt-3">
                        <div className="flex items-start gap-3">
                          <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                              Perlakuan
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              {searchResult.treatment}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Physical Condition */}
                    {searchResult.phisical_condition && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg mt-3">
                        <div className="flex items-start gap-3">
                          <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                              Kondisi Fisik
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              {searchResult.phisical_condition}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Spareparts Section */}
                  {searchResult.spareparts && searchResult.spareparts.length > 0 && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Sparepart Digunakan
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {searchResult.spareparts.map((sp) => (
                          <div
                            key={sp.id}
                            className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white mb-1">
                                  {sp.sparepart_name}
                                </p>
                                {sp.sparepart_variant && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    Varian: {sp.sparepart_variant}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
                                    <DollarSign className="w-4 h-4" />
                                    {formatCurrency(sp.sparepart_price)}
                                  </span>
                                  {sp.sparepart_warranty && (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
                                      <ShieldCheck className="w-4 h-4" />
                                      Garansi {sp.sparepart_warranty}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing Section */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Detail Harga
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Estimasi Biaya</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(searchResult.initial_price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border-2 border-green-500 dark:border-green-600">
                        <span className="font-semibold text-green-900 dark:text-green-300">
                          Harga Final
                        </span>
                        <span className="font-bold text-2xl text-green-700 dark:text-green-400">
                          {formatCurrency(searchResult.final_price)}
                        </span>
                      </div>
                        {/* 1. Kondisi HEMAT: Harga Awal > Harga Final */}
                        {searchResult.initial_price > searchResult.final_price && (
                          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 pt-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-medium">
                              Hemat {formatCurrency(searchResult.initial_price - searchResult.final_price)}
                            </span>
                          </div>
                        )}

                        {/* 2. Kondisi LEBIH MAHAL: Harga Final > Harga Awal */}
                        {searchResult.final_price > searchResult.initial_price && (
                          <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400 pt-2">
                            <AlertCircle className="w-4 h-4" /> {/* Ganti icon biar lebih pas kalo mahal */}
                            <span className="font-medium">
                              Lebih Mahal {formatCurrency(searchResult.final_price - searchResult.initial_price)}
                            </span>
                          </div>
                        )}

                        {/* 3. Kondisi HARGA SAMA: Pas Banget */}
                        {searchResult.initial_price === searchResult.final_price && searchResult.initial_price > 0 && (
                          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 pt-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-medium">
                              Harga Sesuai Estimasi
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Pickup DateTime Section */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                            Waktu Pengambilan
                          </h3>
                          {searchResult.pickedup_at ? (
                            <p className="text-blue-700 dark:text-blue-400 font-medium">
                              {formatDateTime(searchResult.pickedup_at)}
                            </p>
                          ) : (
                            <p className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                              <AlertCircle className="w-4 h-4" />
                              {searchResult.status === 'completed' 
                                ? 'Sudah selesai, menunggu pengambilan' 
                                : searchResult.status === "in_process" 
                                ? "Masih dalam pengerjaan" 
                                : "Belum diambil"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper Component
function InfoItem({ 
  icon, 
  label, 
  value, 
  mono = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
          {label}
        </p>
        <p className={`font-medium text-slate-900 dark:text-white break-words ${mono ? 'font-mono text-sm' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}