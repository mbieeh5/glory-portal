"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

// Daftar bank-bank di Indonesia
const BANK_LIST = ['Bank Rakyat Indonesia (BRI)', 'Bank Negara Indonesia (BNI)',
    'Bank Mandiri', 'Bank Tabungan Negara (BTN)', 'Bank Central Asia (BCA)',
    'CIMB Niaga', 'Bank Danamon', 'Bank Permata', 'Maybank Indonesia', 'Bank Mega',
    'Bank Bukopin', 'Bank Syariah Indonesia (BSI)', 'Bank BRI Syariah', 'Bank BNI Syariah',
    'Bank Mandiri Syariah', 'Bank Muamalat Indonesia', 'Bank Panin', 'Bank OCBC NISP',
    'Bank Commonwealth', 'HSBC Indonesia', 'Citibank Indonesia', 'DBS Indonesia',
    'UOB Indonesia', 'Bank BPD Jawa Barat (BJB)', 'Bank BPD Jawa Timur', 'Bank BPD Jawa Tengah',
    'Bank BPD DIY', 'Bank BPD Bali', 'Bank BPD Nusa Tenggara Barat', 'Bank BPD Nusa Tenggara Timur',
    'Bank BPD Kalimantan Barat', 'Bank BPD Kalimantan Timur', 'Bank BPD Kalimantan Selatan',
    'Bank BPD Kalimantan Tengah', 'Bank BPD Sulawesi Utara', 'Bank BPD Sulawesi Selatan', 'Bank BPD Sulawesi Tenggara',
    'Bank BPD Sulawesi Tengah', 'Bank BPD Maluku', 'Bank BPD Papua', 'Bank Sinarmas', 'Bank Victoria',
    'Bank Ina Perdana', 'Bank Jago', 'Bank Neo Commerce (Jenius)', 'Bank Seabank', 'Bank Aladin Syariah',
    'Bank KB Bukopin Syariah', 'Bank Syariah Mega Indonesia', 'Bank Syariah Bukopin', 'Bank Syariah Mandiri',
    'Bank Syariah BNI', 'Bank Syariah BRI', 'Bank Syariah Indonesia (BSI)', 'Bank Muamalat Indonesia',
    'Bank Panin Syariah', 'Bank Victoria Syariah', 'Bank Mayapada', 'Bank Mayora', 'Bank Capital Indonesia',
    'Bank Fama International', 'Bank Ganesha', 'Bank Harda Internasional', 'Bank Index Selindo',
    'Bank Jasa Jakarta', 'Bank Kesejahteraan Ekonomi', 'Bank Maspion Indonesia', 'Bank Multiarta Sentosa',
    'Bank Nationalnobu', 'Bank Nusantara Parahyangan', 'Bank Pundi Indonesia', 'Bank QNB Indonesia',
    'Bank Raya Indonesia', 'Bank Resona Perdania', 'Bank Royal Indonesia', 'Bank Sahabat Sampoerna',
    'Bank SBI Indonesia', 'Bank Shinhan Indonesia', 'Bank Sumitomo Mitsui Indonesia', 'Bank Tabungan Pensiunan Nasional',
    'Bank UOB Indonesia', 'Bank Victoria International', 'Bank Woori Saudara Indonesia', 'Bank Yudha Bhakti'
]

const LOCATIONS = ["Cikaret", "Sukahati"];

export default function TransferFormPage() {
  const router = useRouter();
  
  // Form states
  const [recipientName, setRecipientName] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [location, setLocation] = useState("Cikaret");
  const [searchBank, setSearchBank] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle bank selection
  const handleSelectBank = (bank: string) => {
    setRecipientBank(bank);
    setSearchBank(bank);
    setShowBankDropdown(false);
  };

  // Handle amount input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setAmount(Number(value));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (!recipientName || !recipientBank || !recipientAccount || amount <= 0) {
      alert("Mohon lengkapi semua data!");
      setIsSubmitting(false);
      return;
    }

    // TODO: Replace dengan actual API call
    const transferData = {
      recipientName,
      recipientBank,
      recipientAccount,
      amount,
      adminMargin,
      totalAmount,
      location,
      timestamp: new Date().toISOString()
    };
    
    // Simulate API call
    setTimeout(() => {
      alert("Transfer berhasil dibuat!");
      // Redirect ke halaman print
      router.push(`/print/TRF-${Date.now()}`);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-light tracking-tight text-slate-900 dark:text-slate-50 mb-3">
            Transfer Antar Bank
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-light">
            Isi formulir transfer dengan lengkap
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
                {/* Nama Penerima */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nama Penerima
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                    placeholder="Masukkan nama penerima"
                    required
                  />
                </div>

                {/* Bank Penerima - dengan search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bank Penerima
                  </label>
                  <input
                    type="text"
                    value={searchBank}
                    onChange={(e) => {
                      setSearchBank(e.target.value);
                      setShowBankDropdown(true);
                    }}
                    onFocus={() => setShowBankDropdown(true)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                    placeholder="Cari atau pilih bank..."
                    required
                  />
                  
                  {/* Dropdown Bank List */}
                  {showBankDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredBanks.length > 0 ? (
                        filteredBanks.map((bank, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectBank(bank)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                          >
                            {bank}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center">
                          Bank tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* No Rekening */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={recipientAccount}
                    onChange={(e) => setRecipientAccount(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 font-mono"
                    placeholder="1234567890"
                    required
                  />
                </div>

                {/* Nominal */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nominal Transfer
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={amount > 0 ? amount.toLocaleString('id-ID') : ''}
                      onChange={handleAmountChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 font-mono text-lg"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Lokasi */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Lokasi
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                    required
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Summary Box */}
                <div className="mt-8 p-6 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                    Ringkasan Transfer
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Nominal Transfer</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-lg">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Biaya Admin</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(adminMargin)}
                      </span>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-300 dark:border-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Total Bayar</span>
                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 text-2xl">
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
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all duration-300 font-medium"
                  >
                    Batal
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}