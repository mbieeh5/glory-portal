'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Search, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  Smartphone, 
  User, 
  CalendarDays, 
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Wrench
} from 'lucide-react';
import { checkNotaExists, verifyAndGetNotaData } from '@/lib/services/checknota.services';

// --- TIPE DATA ---
export interface NotaData {
  nomorNota: string;
  nama: string;
  layanan: string;
  nomorHp: string;
  status: string;
  tanggal: string;
  total: string;
}

// --- COMPONENT: RESULT CARD (ELEGANT TICKET) ---
const NotaResultCard = ({ data }: { data: NotaData }) => {
  // Tentukan warna berdasarkan status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_process': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400';
      case 'canceled': return 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400';
      case 'completed': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'picked_up': return <CheckCircle2 size={20} />;
      case 'in_process': return <Clock size={20} />;
      case 'canceled': return <XCircle size={20} />;
      case 'completed': return <Wrench size={20} />;
      default: return <Wrench size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'picked_up': return 'Selesai';
      case 'in_process': return 'Dalam Proses';
      case 'canceled': return 'Dibatalkan';
      case 'completed': return 'Siap Diambil';
      default: return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 relative"
    >
      {/* Decorative Top Bar */}
      <div className="h-1.5 md:h-2 w-full bg-gradient-to-r from-orange-500 to-red-500" />

      <div className="p-5 md:p-8 relative">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Smartphone size={100} />
        </div>

        {/* Header: Nota & Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <p className="text-[10px] md:text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Nomor Nota</p>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{data.nomorNota}</h3>
          </div>
          <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full border flex items-center gap-2 font-bold text-xs md:text-sm ${getStatusColor(data.status)}`}>
            {getStatusIcon(data.status)}
            {getStatusLabel(data.status)}
          </div>
        </div>

        {/* Device & User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shrink-0">
              <Smartphone size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Kondisi / Layanan</p>
              <p className="font-semibold text-gray-900 dark:text-white text-base md:text-lg leading-tight">{data.layanan}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 md:gap-4">
             <div className="p-2.5 md:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
              <User size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pemilik</p>
              <p className="font-semibold text-gray-900 dark:text-white text-base md:text-lg">{data.nama}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{data.nomorHp}</p>
            </div>
          </div>
        </div>

        {/* Divider Dashed */}
        <div className="w-full border-t-2 border-dashed border-gray-200 dark:border-gray-700 my-5 md:my-6 relative">
          <div className="absolute -left-7 md:-left-10 -top-3 w-5 h-5 md:w-6 md:h-6 bg-gray-50 dark:bg-gray-950 rounded-full" />
          <div className="absolute -right-7 md:-right-10 -top-3 w-5 h-5 md:w-6 md:h-6 bg-gray-50 dark:bg-gray-950 rounded-full" />
        </div>

        {/* Details Bottom */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] md:text-xs mb-1">
              <CalendarDays size={12} className="md:w-3.5 md:h-3.5" /> TANGGAL MASUK
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300 text-sm md:text-base">{data.tanggal}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-gray-400 text-[10px] md:text-xs mb-1">
              <CreditCard size={12} className="md:w-3.5 md:h-3.5" /> TOTAL BIAYA
            </div>
            <p className="font-bold text-lg md:text-xl text-orange-600 dark:text-orange-400">{data.total}</p>
          </div>
        </div>
      </div>
      
      {/* Footer Ticket */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-3 md:p-4 text-center border-t border-gray-100 dark:border-gray-700">
        <p className="text-[10px] md:text-xs text-gray-400">
          *Tunjukkan tiket digital ini saat pengambilan unit.
        </p>
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
const CekNota = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [nomorNota, setNomorNota] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '']);
  const [result, setResult] = useState<NotaData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'nota' | 'verifikasi'>('nota');
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { setIsMounted(true); }, []);

  const handleVerifikasi = useCallback(async () => {
    const inputLast5 = otpValues.join('');
    setLoading(true);
    setError('');
    try {
      const response = await verifyAndGetNotaData(nomorNota, inputLast5);

      if (response.found && response.data) {
        // Success - show result
        setResult(response.data);
        setError('');
      } else {
        // Failed verification or error
        setError(response.error || 'Verifikasi gagal.');
        setOtpValues(['', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan sistem. Coba lagi.');
      setOtpValues(['', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  }, [otpValues, nomorNota]);

  // Auto-submit OTP
  useEffect(() => {
    const allFilled = otpValues.every(val => val !== '');
    if (allFilled && step === 'verifikasi' && !loading) {
      handleVerifikasi();
    }
  }, [otpValues, step, loading, handleVerifikasi]);

  const handleSubmitNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorNota.trim()) {
      setError('Masukkan nomor nota terlebih dahulu.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await checkNotaExists(nomorNota.trim());

      if (response.found && response.requiresVerification) {
        // Nota found, proceed to verification
        setStep('verifikasi');
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        // Nota not found or error
        setError(response.error || `Nota "${nomorNota}" tidak ditemukan.`);
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan sistem. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    if (value && index < 4) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 5).split('');
    if (digits.length > 0) {
      const newOtpValues = [...otpValues];
      digits.forEach((digit, index) => { if (index < 5) newOtpValues[index] = digit; });
      setOtpValues(newOtpValues);
      const nextIndex = Math.min(digits.length, 4);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleReset = () => {
    setNomorNota('');
    setOtpValues(['', '', '', '', '']);
    setResult(null);
    setError('');
    setStep('nota');
  };

  if (!isMounted) return null;

  return (
    <section id="cek-nota" className="py-20 bg-gray-50 dark:bg-gray-950 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decor (Grid Pattern) */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-grid-black dark:bg-grid-white" 
           style={{ backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`, backgroundSize: '24px 24px' }} 
      />

      <div className="container mx-auto px-4 max-w-xl relative z-10">
        
        {/* --- HEADER TITLE --- */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl mb-4">
             <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">Tracking System</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {step === 'nota' 
              ? 'Masukkan Nomor Nota (Contoh: GLRY001)' 
              : 'Verifikasi Keamanan Data'}
          </p>
        </div>

        {/* --- MAIN CARD --- */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl relative">
          
          <AnimatePresence mode="wait">
            
            {/* --- STEP 1: INPUT NOTA --- */}
            {step === 'nota' && !result && (
              <motion.form
                key="nota-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmitNota}
                className="space-y-6"
              >
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="GPS-..."
                    value={nomorNota}
                    onChange={(e) => setNomorNota(e.target.value.toUpperCase())}
                    className="w-full p-4 pl-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono text-lg placeholder-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all uppercase"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Lacak Sekarang'}
                </button>
              </motion.form>
            )}

            {/* --- STEP 2: VERIFIKASI OTP --- */}
            {step === 'verifikasi' && !result && (
              <motion.div
                key="verifikasi-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Masukkan <span className="text-orange-500 font-bold">5 digit terakhir</span> nomor HP yang terdaftar untuk nota <span className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{nomorNota}</span>
                   </p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-4">
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      disabled={loading}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl bg-gray-50 dark:bg-gray-800 border-2 outline-none transition-all
                        ${value 
                          ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' 
                          : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-orange-400'
                        }
                      `}
                    />
                  ))}
                </div>

                {loading && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 text-orange-500">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Memverifikasi Data...</span>
                   </motion.div>
                )}

                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-orange-500 transition-colors text-sm font-medium pt-4 border-t border-gray-100 dark:border-gray-800"
                >
                  <ArrowLeft size={16} /> Batalkan
                </button>
              </motion.div>
            )}

            {/* --- STEP 3: RESULT --- */}
            {result && (
              <motion.div
                key="result"
                className="relative mt-12"
              >
                 {/* Tombol Back jadi Floating di atas tiket */}
                 <button 
                    onClick={handleReset}
                    className="absolute -top-10 left-0 flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors"
                 >
                    <ArrowLeft size={16} /> Cari Nota Lain
                 </button>
                 
                 <NotaResultCard data={result} />
              </motion.div>
            )}

          </AnimatePresence>

          {/* Error Message Toast Style */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -bottom-16 left-0 right-0 mx-auto w-full text-center"
              >
                 <div className="inline-block px-4 py-2 bg-red-100 dark:bg-red-900/80 text-red-600 dark:text-red-200 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 shadow-lg">
                    {error}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
};

export default CekNota;