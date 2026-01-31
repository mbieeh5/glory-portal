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
  Ban
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
    if(!invoiceId.trim()){
      setIsSearching(false);
      setNotFound(true);
      return
    }
    const SingleData = await CheckDataSatuanService(invoiceId)

    if(SingleData){
      setSearchResult(SingleData);
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
  const getStatusBadge = (status: 'in_process' | 'completed' | 'canceled' | 'picked_up') => {
    const statusConfig = {
      in_process: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        border: 'border-yellow-300 dark:border-yellow-700',
        text: 'text-yellow-900 dark:text-yellow-300',
        icon: <Clock className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />,
        label: 'In Process'
      },
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-300 dark:border-green-700',
        text: 'text-green-900 dark:text-green-300',
        icon: <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" />,
        label: 'Success'
      },
      canceled: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-300 dark:border-red-700',
        text: 'text-red-900 dark:text-red-300',
        icon: <Ban className="w-5 h-5 text-red-700 dark:text-red-400" />,
        label: 'Canceled'
      },
      picked_up: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-300 dark:border-blue-700',
        text: 'text-blue-900 dark:text-blue-300',
        icon: <Package className="w-5 h-5 text-blue-700 dark:text-blue-400" />,
        label: 'Picked Up'
      }
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

              {/* Customer & Device Info */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-700 dark:to-orange-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {searchResult.customer_id}
                      </h2>
                      <p className="text-orange-100">
                        Invoice: <span className="font-mono font-semibold">{searchResult.invoice_id}</span>
                      </p>
                    </div>
                    <FileText className="w-12 h-12 text-orange-200" />
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem
                      icon={<User className="w-5 h-5" />}
                      label="Penerima"
                      value={searchResult.recipient_name}
                    />
                    <InfoItem
                      icon={<Phone className="w-5 h-5" />}
                      label="Brand HP"
                      value={searchResult.phone_brand}
                    />
                    <InfoItem
                      icon={<Smartphone className="w-5 h-5" />}
                      label="IMEI"
                      value={searchResult.phone_imei || '-'}
                      mono
                    />
                    <InfoItem
                      icon={<MapPin className="w-5 h-5" />}
                      label="Lokasi Service"
                      value={searchResult.location}
                    />
                    <InfoItem
                      icon={<User className="w-5 h-5" />}
                      label="Teknisi"
                      value={searchResult.technician}
                    />
                    <InfoItem
                      icon={<Calendar className="w-5 h-5" />}
                      label="Tanggal Masuk"
                      value={formatDateTime(searchResult.entry_datetime)}
                    />
                  </div>

                  {/* Complaint */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                          Keluhan
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {searchResult.complaint}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Spareparts */}
                  {searchResult.spareparts && searchResult.spareparts.length > 0 && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          Spareparts
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {searchResult.spareparts.map((sp) => (
                          <div
                            key={sp.id}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {sp.sparepart_name}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {sp.sparepert_variant}
                              </p>
                            </div>
                            <p className="font-semibold text-orange-600 dark:text-orange-400">
                              {sp.sparepart_warranty ? `Garansi: ${sp.sparepart_warranty}` : 'No Warranty'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Detail Harga
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <span className="text-slate-600 dark:text-slate-400">Harga Awal</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(searchResult.initial_price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border-2 border-green-500 dark:border-green-600">
                        <span className="font-semibold text-green-900 dark:text-green-300">
                          Harga Final
                        </span>
                        <span className="font-bold text-xl text-green-700 dark:text-green-400">
                          {formatCurrency(searchResult.final_price)}
                        </span>
                      </div>
                      {searchResult.initial_price !== searchResult.final_price && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Hemat {formatCurrency(searchResult.initial_price - searchResult.final_price)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pickup DateTime */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                          Waktu Pengambilan
                        </h3>
                        <p className="text-blue-700 dark:text-blue-400">
                          {searchResult.pickuped_datetime ? (
                            formatDateTime(searchResult.pickuped_datetime)
                          ) : (
                            <span className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              {searchResult.pickuped_datetime || searchResult.status === 'completed' ? 'sudah diambil' : searchResult.status === "in_process" ? "Dalam Pengerjaan" : "belum diambil" }
                            </span>
                          )}
                        </p>
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
    <div className="flex items-start gap-3">
      <div className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
          {label}
        </p>
        <p className={`font-medium text-slate-900 dark:text-white break-words ${mono ? 'font-mono text-sm' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}