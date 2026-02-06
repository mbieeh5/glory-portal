"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  Plus,
  Wallet,
  TrendingUp,
  Building2,
  CreditCard,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// --- TYPES (Sesuaikan sama DB glory.bank_config) ---
interface Bank {
  id: string;
  bank_name: string; 
  account_name: string;
  account_number: string;
  current_balance: number;
}

// Custom Alert Component (Tetap sama)
interface CustomAlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ type, message, onClose }) => {
  const icons = {
    success: <Check className="w-6 h-6" />,
    error: <X className="w-6 h-6" />,
    warning: <AlertCircle className="w-6 h-6" />,
    info: <AlertCircle className="w-6 h-6" />,
  };

  const colors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`flex items-start gap-3 p-4 rounded-xl border-2 shadow-2xl backdrop-blur-sm max-w-md ${colors[type]}`}>
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <button onClick={onClose} className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Format Currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function BalancePage() {
  const supabase = createClient();
  
  // State Data Real
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state awal
  
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDescription, setTransferDescription] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Add Balance Modal State
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [addBalanceBank, setAddBalanceBank] = useState("");
  const [addBalanceAmount, setAddBalanceAmount] = useState<number>(0);
  const [addBalanceDescription, setAddBalanceDescription] = useState("");
  const [isAddingBalance, setIsAddingBalance] = useState(false);

  // Show Alert Helper
  const showAlert = (type: "success" | "error" | "warning" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // 🔄 FETCH DATA BANKS (Realtime Pull)
  const fetchBanks = useCallback(async () => {
    try {
      // setIsLoading(true); // Opsional: kalo mau loading indicator tiap refresh
      const { data, error } = await supabase
        .schema('glory')
        .from('bank_config')
        .select('*')
        .eq('is_active', true) // Ambil yang aktif aja
        .order('bank_name', { ascending: true });

      if (error) throw error;
      setBanks(data || []);
    } catch (error) {
      console.error("Error fetching banks:", error);
      showAlert("error", "Gagal memuat data bank.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Load data pas pertama kali buka
  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  // Calculate Total Balance
  const totalBalance = useMemo(() => {
    return banks.reduce((sum, bank) => sum + bank.current_balance, 0);
  }, [banks]);

  // 💸 HANDLE TRANSFER (RPC)
  const handleTransfer = async () => {
    if (!transferFrom || !transferTo || transferAmount <= 0) {
      showAlert("warning", "Mohon lengkapi semua data transfer!");
      return;
    }

    // Validasi Saldo Client Side (Biar gak buang request ke server)
    const sourceBank = banks.find(b => b.id === transferFrom);
    if (sourceBank && sourceBank.current_balance < transferAmount) {
        showAlert("error", "Saldo tidak mencukupi!");
        return;
    }

    setIsTransferring(true);
    
    try {
      const { error } = await supabase.schema('glory').rpc('fn_internal_transfer', {
        p_from_bank_id: transferFrom,
        p_to_bank_id: transferTo,
        p_amount: transferAmount,
        p_description: transferDescription || "Pindah Saldo Internal"
      });

      if(error) {
        console.error(error)
        throw error
    };

      showAlert("success", `Pindah saldo ${formatCurrency(transferAmount)} berhasil!`);
      setShowTransferModal(false);
      
      // Reset Form
      setTransferFrom("");
      setTransferTo("");
      setTransferAmount(0);
      setTransferDescription("");

      // 🔥 PENTING: Refresh data biar UI update saldonya
      await fetchBanks();

    } catch (error) {
      console.error("Transfer error:", error);
      showAlert("error", "Transfer gagal: " + error);
    } finally {
      setIsTransferring(false);
    }
  };

  // 💰 HANDLE ADD BALANCE (Top Up)
    const handleAddBalance = async () => {
    if (!addBalanceBank || addBalanceAmount <= 0) {
        showAlert("warning", "Isi bank dan nominalnya dulu!");
        return;
    }

    setIsAddingBalance(true);
    const supabase = createClient();

    try {
        const { error } = await supabase
        .schema('glory')
        .rpc('fn_add_internal_balance', {
            p_bank_id: addBalanceBank,
            p_amount: addBalanceAmount,
            p_description: addBalanceDescription || "Tambah Saldo Manual"
        });

        if (error) throw error;

        showAlert("success", `Mantap! Saldo berhasil ditambah ke brankas.`);
        setShowAddBalanceModal(false);
        
        // Reset Form & Refresh Angka di Layar
        setAddBalanceAmount(0);
        setAddBalanceDescription("");
        await fetchBanks(); 

    } catch (error) {
        console.error("Add Balance Error:", error);
        showAlert("error", "Gagal nambah saldo: " + error);
    } finally {
        setIsAddingBalance(false);
    }
    };

  // Handle amount input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: number) => void) => {
    const value = e.target.value.replace(/\D/g, "");
    setter(Number(value));
  };

  // Get available banks for transfer destination
  const availableDestinationBanks = useMemo(() => {
    return banks.filter((bank) => bank.id !== transferFrom);
  }, [transferFrom, banks]);

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse text-slate-500">Memuat Saldo...</p></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6">
      {/* Custom Alert */}
      {alert && <CustomAlert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-50">Kelola Saldo</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Pantau dan kelola saldo semua rekening bank</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Pindah Saldo
            </button>

            <button
              onClick={() => setShowAddBalanceModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Saldo
            </button>
          </div>
        </motion.div>

        {/* Total Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">Total Saldo Keseluruhan</p>
                <p className="text-2xl sm:text-4xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 font-mono text-center">                  {formatCurrency(totalBalance)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Dari {banks.length} rekening bank</p>
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl flex items-center justify-center">
                <Wallet className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bank Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {banks.map((bank, index) => (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="group"
            >
              <div className="relative h-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        {/* UPDATE: Pake bank_name (BCA/MANDIRI) bukan account_name (Nama Orang) */}
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{bank.bank_name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">{bank.account_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Saldo Saat Ini</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(bank.current_balance)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                     <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{bank.account_name}</span>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTransferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pindah Saldo Antar Bank</h3>
                </div>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Bank Asal */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bank Asal</label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                    required
                  >
                    <option value="">Pilih bank asal...</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bank_name} - {formatCurrency(bank.current_balance)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bank Tujuan */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bank Tujuan</label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                    required
                    disabled={!transferFrom}
                  >
                    <option value="">Pilih bank tujuan...</option>
                    {availableDestinationBanks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bank_name} - {formatCurrency(bank.current_balance)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nominal */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nominal Transfer</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">Rp</span>
                    <input
                      type="text"
                      value={transferAmount > 0 ? transferAmount.toLocaleString("id-ID") : ""}
                      onChange={(e) => handleAmountChange(e, setTransferAmount)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 font-mono text-lg"
                      placeholder="0"
                      required
                    />
                  </div>
                  {transferFrom && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      Saldo tersedia: {formatCurrency(banks.find((b) => b.id === transferFrom)?.current_balance || 0)}
                    </p>
                  )}
                </div>

                {/* Keterangan */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Keterangan <span className="text-slate-400">(Opsional)</span>
                  </label>
                  <textarea
                    value={transferDescription}
                    onChange={(e) => setTransferDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 resize-none"
                    placeholder="Catatan transfer (opsional)..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 font-medium"
                    disabled={isTransferring}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isTransferring ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <ArrowLeftRight className="w-5 h-5" />
                        Transfer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Balance Modal */}
      <AnimatePresence>
        {showAddBalanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddBalanceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tambah Saldo Bank</h3>
                </div>
                <button
                  onClick={() => setShowAddBalanceModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Pilih Bank */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pilih Bank</label>
                  <select
                    value={addBalanceBank}
                    onChange={(e) => setAddBalanceBank(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                    required
                  >
                    <option value="">Pilih bank...</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bank_name} - Saldo: {formatCurrency(bank.current_balance)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nominal */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nominal Tambahan</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">Rp</span>
                    <input
                      type="text"
                      value={addBalanceAmount > 0 ? addBalanceAmount.toLocaleString("id-ID") : ""}
                      onChange={(e) => handleAmountChange(e, setAddBalanceAmount)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 font-mono text-lg"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Keterangan */}
                <div className="group/field">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Keterangan</label>
                  <textarea
                    value={addBalanceDescription}
                    onChange={(e) => setAddBalanceDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 resize-none"
                    placeholder="Sumber dana / catatan..."
                    required
                  />
                </div>

                {/* Summary Box */}
                {addBalanceBank && addBalanceAmount > 0 && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-wider">Ringkasan</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600 dark:text-emerald-400">Saldo Sekarang</span>
                        <span className="font-medium text-emerald-900 dark:text-emerald-100 font-mono">
                          {formatCurrency(banks.find((b) => b.id === addBalanceBank)?.current_balance || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600 dark:text-emerald-400">Ditambah</span>
                        <span className="font-medium text-emerald-900 dark:text-emerald-100 font-mono">
                          {formatCurrency(addBalanceAmount)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-emerald-300 dark:border-emerald-700">
                        <div className="flex justify-between">
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Saldo Baru</span>
                          <span className="font-bold text-emerald-900 dark:text-emerald-100 font-mono text-lg">
                            {formatCurrency((banks.find((b) => b.id === addBalanceBank)?.current_balance || 0) + addBalanceAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddBalanceModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 font-medium"
                    disabled={isAddingBalance}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddBalance}
                    disabled={isAddingBalance}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAddingBalance ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Tambah Saldo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom CSS for animations */}
      <style jsx>{`
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

        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}