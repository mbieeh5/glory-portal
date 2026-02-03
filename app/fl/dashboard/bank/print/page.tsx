"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import getBankAccounts from "@/lib/services/bankaccount.services";
import { BankConfig } from "@/config/type";
import { BankSeparator } from "@/config/BankSeparator";
import { createClient } from "@/lib/supabase/client";

// Daftar bank-bank di Indonesia
const BANK_LIST = [
  'Bank Rakyat Indonesia (BRI)', 'Bank Negara Indonesia (BNI)',
  'Bank Mandiri', 'Bank Tabungan Negara (BTN)', 'Bank Central Asia (BCA)',
  'CIMB Niaga', 'Bank Danamon', 'Bank Permata', 'Maybank Indonesia', 'Bank Mega',
  'Bank Bukopin', 'Bank Syariah Indonesia (BSI)', 'Bank BRI Syariah', 'Bank BNI Syariah',
  'Bank Mandiri Syariah', 'Bank Muamalat Indonesia', 'Bank Panin', 'Bank OCBC NISP',
  'Bank Mandiri Taspen', 'DBS Indonesia', 'UOB Indonesia', 'BPD Jawa Barat (BJB)',
  'BPD Jawa Timur', 'BPD Jawa Tengah', 'BPD DIY', 'BPD Bali', 'BPD Nusa Tenggara Barat',
  'BPD Nusa Tenggara Timur', 'BPD Kalimantan Barat', 'BPD Kalimantan Timur',
  'BPD Kalimantan Selatan', 'BPD Sumatera Barat (Nagari)', 'BPD Kalimantan Tengah',
  'BPD Sulawesi Utara', 'BPD Sulawesi Selatan', 'BPD Sulawesi Tenggara',
  'BPD Sulawesi Tengah', 'BPD Maluku', 'BPD Papua', 'Bank Sinarmas', 'Bank Victoria',
  'Bank Ina Perdana', 'Bank Jago', 'Bank Neo Commerce (Jenius)', 'Seabank',
  'Bank Aladin Syariah', 'Bank KB Bukopin Syariah', 'Bank Syariah Mega Indonesia',
  'Bank Syariah Bukopin',
];

const LOCATIONS = ["Cikaret", "Sukahati"];

// Custom Alert Component
interface CustomAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ type, message, onClose }) => {
  const icons = {
    success: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const colors = {
    success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`flex items-start gap-3 p-4 rounded-xl border-2 shadow-2xl backdrop-blur-sm max-w-md ${colors[type]}`}>
        <div className="flex-shrink-0 mt-0.5">
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function TransferFormPage() {
  const router = useRouter();
  
  // Form states
  const [recipientName, setRecipientName] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [description, setDescription] = useState("Glory Cell");
  const [amount, setAmount] = useState<number>(0);
  const [location, setLocation] = useState("Cikaret");
  const [searchBank, setSearchBank] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankConfig, setBankConfig] = useState<BankConfig[] | null>(null);
  
  // Alert state
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  // Helper function to show alert
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000); // Auto dismiss after 5 seconds
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getBankAccounts();
        setBankConfig(result);
      } catch (error) {
        console.error("Error fetching bank data:", error);
        showAlert('error', 'Gagal memuat data bank. Silakan refresh halaman.');
      }
    };
    
    fetchData();
  }, []);

  // Calculate admin margin
  const calculateAdminMargin = useCallback((amount: number): number => {
    if (amount <= 0) return 0;
    
    // Tier Dasar (<= 10 Juta)
    if (amount <= 500_000) return 5_000;
    if (amount <= 1_000_000) return 10_000;
    if (amount <= 3_000_000) return 15_000;
    if (amount <= 5_000_000) return 20_000;
    if (amount <= 10_000_000) return 25_000;

    // Logic "Kelipatan" > 10 Juta
    const maxTier = 10_000_000;
    const maxFee = 25_000;
    
    const remainder = amount - maxTier;
    return maxFee + calculateAdminMargin(remainder);
  }, []);

  // Admin margin & total
  const adminMargin = useMemo(() => calculateAdminMargin(amount), [amount, calculateAdminMargin]);
  const totalAmount = useMemo(() => amount + adminMargin, [amount, adminMargin]);

  // Filter banks based on search
  const filteredBanks = useMemo(() => {
    if (!searchBank) return BANK_LIST;
    return BANK_LIST.filter(bank => 
      bank.toLowerCase().includes(searchBank.toLowerCase())
    );
  }, [searchBank]);

  const handleFormReset = () => {
    setRecipientName("");
    setRecipientBank("");
    setRecipientAccount("");
    setAmount(0);
    setSearchBank("");
    setShowBankDropdown(false);
    setDescription("Glory Cell");
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle bank config
  const handleBankConfig = useMemo(() => {
    const BankSeparators = BankSeparator(recipientBank);
    const selectedBank = bankConfig?.find((bank) => bank.bank_name.split("_").join(" ") === BankSeparators);

    return {
      selectedBankName: selectedBank?.bank_name,
      selectedBankId: selectedBank?.id
    };
  }, [recipientBank, bankConfig]);

  // Handle bank selection
  const handleSelectBank = (bank: string) => {
    setRecipientBank(bank);
    setSearchBank(bank);
    setShowBankDropdown(false);
  };

  // Handle amount input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(Number(value));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // 1. Get user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showAlert('error', 'Sesi kadaluarsa. Silakan login ulang.');
        setIsSubmitting(false);
        return;
      }
      
      // 2. Validation
      if (!recipientName || !recipientBank || !recipientAccount || amount <= 0 || !handleBankConfig.selectedBankId) {
        showAlert('warning', 'Mohon lengkapi semua data termasuk Bank Asal!');
        setIsSubmitting(false);
        return;
      }

      // 3. Generate unique transfer ID
      const locationPrefix = location === "Cikaret" ? "CKT" : "SKH";
      const timestamp = Date.now().toString();
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const transferId = `${locationPrefix}-${timestamp}-${randomStr}`;

      // 4. Call RPC
      const { error } = await supabase.schema('glory').rpc('fn_process_bank_transactions_v2', {
        p_transfer_id: transferId,
        p_bank_id: handleBankConfig.selectedBankId,
        p_amount: Number(amount),
        p_type_transactions: 'OUT',
        p_description: description || '-',
        p_customer_name: recipientName.toUpperCase(),
        p_customer_bank_account: recipientAccount.replace(/[^0-9]/g, ''),
        p_customer_bank_name: recipientBank
      });

      if (error) {
        console.error("Transaction Failed:", error);
        
        // Parse error messages for better UX
        let errorMessage = 'Transaksi gagal. Silakan coba lagi.';
        
        if (error.message.toLowerCase().includes('insufficient') || 
            error.message.toLowerCase().includes('saldo') ||
            error.message.toLowerCase().includes('balance')) {
          errorMessage = '❌ Saldo tidak mencukupi. Silakan periksa saldo bank.';
        } else if (error.message.toLowerCase().includes('duplicate')) {
          errorMessage = '⚠️ Transaksi duplikat terdeteksi.';
        } else if (error.message.toLowerCase().includes('network')) {
          errorMessage = '🌐 Koneksi bermasalah. Periksa internet Anda.';
        } else if (error.message) {
          errorMessage = `❌ ${error.message}`;
        }
        
        showAlert('error', errorMessage);
        setIsSubmitting(false);
        return;
      }

      // 5. Success
      showAlert('success', 'Transfer berhasil diproses!');
      handleFormReset();
      
      // Small delay before navigation for better UX
      setTimeout(() => {
        router.push(`print/${encodeURIComponent(transferId)}`);
      }, 800);
      
    } catch (error) {
      console.error("Unexpected error:", error);
      showAlert('error', '⚠️ Terjadi kesalahan. Silakan coba lagi.');
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 py-8 px-4">
      {/* Custom Alert */}
      {alert && (
        <CustomAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-light tracking-tight text-slate-900 dark:text-slate-50 mb-3">
            Transfer Antar Bank
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-light">
            Isi formulir transfer dengan lengkap dan teliti
          </p>
        </div>

        {/* Form Card */}
        <div className="relative group animate-slide-up">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          
          {/* Card */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent dark:from-blue-400/10 dark:via-purple-400/10 rounded-full blur-3xl"></div>
            
            <form onSubmit={handleSubmit} className="relative p-8">
              <div className="space-y-6">
                {/* Lokasi */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 group-hover/field:text-blue-600 dark:group-hover/field:text-blue-400 transition-colors">
                    Lokasi
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 hover:border-blue-400 dark:hover:border-blue-500"
                    required
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transfer Pake Bank */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 group-hover/field:text-blue-600 dark:group-hover/field:text-blue-400 transition-colors">
                     Transfer Pake Bank
                  </label>
                  <select
                    value={handleBankConfig?.selectedBankId || ''}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={handleBankConfig?.selectedBankName !== "DANAMON"}
                  >
                    {bankConfig?.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bank_name.split('_').join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bank Penerima - dengan search */}
                <div className="relative group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 group-hover/field:text-blue-600 dark:group-hover/field:text-blue-400 transition-colors">
                     Bank Penerima
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchBank}
                      onChange={(e) => {
                        setSearchBank(e.target.value);
                        setShowBankDropdown(true);
                      }}
                      onFocus={() => setShowBankDropdown(true)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 hover:border-blue-400 dark:hover:border-blue-500"
                      placeholder="Cari atau pilih bank..."
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Dropdown Bank List */}
                  {showBankDropdown && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowBankDropdown(false)}
                      />
                      
                      <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-slide-down">
                        {filteredBanks.length > 0 ? (
                          filteredBanks.map((bank, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSelectBank(bank)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-slate-700 active:bg-blue-100 dark:active:bg-slate-600 transition-colors text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                            >
                              {bank}
                            </button>
                          ))
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectBank(searchBank)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-slate-100"
                          >
                            <span className="text-slate-600 dark:text-slate-400">Gunakan:</span> <strong>{searchBank}</strong>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Nama Penerima */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 group-hover/field:text-blue-600 dark:group-hover/field:text-blue-400 transition-colors">
                     Nama Penerima
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 hover:border-blue-400 dark:hover:border-blue-500"
                    placeholder="Masukkan nama penerima"
                    required
                  />
                </div>

                {/* No Rekening */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 group-hover/field:text-blue-600 dark:group-hover/field:text-blue-400 transition-colors">
                     Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={recipientAccount}
                    onChange={(e) => setRecipientAccount(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 font-mono tracking-wider hover:border-blue-400 dark:hover:border-blue-500"
                    placeholder="1234567890"
                    required
                  />
                </div>

                {/* Berita */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 group-hover/field:text-blue-600 dark:group-hover/field:text-blue-400 transition-colors">
                     Berita Transfer
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 hover:border-blue-400 dark:hover:border-blue-500"
                    placeholder="Glory Cell"
                    required
                  />
                </div>

                {/* Nominal */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 group-hover/field:text-blue-600 dark:group-hover/field:text-blue-400 transition-colors">
                     Nominal Transfer
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={amount > 0 ? amount.toLocaleString('id-ID') : ''}
                      onChange={handleAmountChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 font-mono text-lg hover:border-blue-400 dark:hover:border-blue-500"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Summary Box */}
                <div className="mt-8 p-6 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ringkasan Transfer
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Nominal Transfer</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-lg font-mono">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Biaya Admin</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 font-mono">
                        {formatCurrency(adminMargin)}
                      </span>
                    </div>
                    
                    <div className="pt-3 border-t-2 border-slate-300 dark:border-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">Total Bayar</span>
                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 text-2xl font-mono">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleFormReset}
                    className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Proses Transfer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.2s both;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}