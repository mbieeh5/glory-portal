'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, AlertTriangle, 
  FileText, RefreshCcw, Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// Import types lu di sini (asumsi lu taro di file misal types.ts)
// import { BankTransaction, BankConfig, TransactionType, StatusBankEnum } from './types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Utility format rupiah
const formatRp = (amount: number = 0) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function BanksParents() {
  const [transactions, setTransactions] = useState<any[]>([]); // Ganti 'any' pake 'BankTransaction' kalo udah di-import
  const [totalBalance, setTotalBalance] = useState(0);
  const [incomeThisMonth, setIncomeThisMonth] = useState(0);
  const [expenseThisMonth, setExpenseThisMonth] = useState(0);
  const [pendingRecap, setPendingRecap] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Tarik config buat Total Balance dari schema 'glory'
      const { data: configs } = await supabase
        .schema('glory')
        .from('bank_config') // Sesuaikan nama tabel
        .select('current_balance');
      
      const balance = configs?.reduce((acc, curr) => acc + (Number(curr.current_balance) || 0), 0) || 0;
      setTotalBalance(balance);

      // 2. Tarik transaksi buat history & kalkulasi bulan ini
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const { data: trxs } = await supabase
        .schema('glory')
        .from('bank_transactions') // Sesuaikan nama tabel
        .select('*')
        .order('entry_datetime', { ascending: false })
        .limit(50); // Ambil 50 data terakhir buat dikalkulasi

      if (trxs) {
        setTransactions(trxs);

        // Kalkulasi masuk, keluar, dan yang belum di rekap
        let income = 0;
        let expense = 0;
        let pending = 0;

        trxs.forEach((trx) => {
          const trxDate = new Date(trx.entry_datetime);
          
          // Hitung yang belum di-check (Recap)
          if (!trx.is_check) pending += 1;

          // Hitung in/out bulan ini
          if (trxDate.getMonth() === currentMonth && trxDate.getFullYear() === currentYear) {
            if (trx.type_transactions.trim() === 'IN') income += Number(trx.amount);
            if (trx.type_transactions === 'OUT') expense += Number(trx.amount);
          }
        });

        setIncomeThisMonth(income);
        setExpenseThisMonth(expense);
        setPendingRecap(pending);
      }
    } catch (error) {
      console.error("Error fetching bank data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-orange-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      className="p-6 w-full max-w-7xl mx-auto text-gray-900 dark:text-gray-100"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Command Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overview saldo dan rekonsiliasi.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCcw size={16} /> Sync Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div variants={itemVariants} className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Saldo (All Banks)</p>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-bold">{formatRp(totalBalance)}</h3>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pemasukan Bulan Ini</p>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-bold">{formatRp(incomeThisMonth)}</h3>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pengeluaran Bulan Ini</p>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-bold">{formatRp(expenseThisMonth)}</h3>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Butuh Rekap Nota!</p>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-500 relative z-10">
            {pendingRecap} Transaksi
          </h3>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Transactions */}
        <motion.div variants={itemVariants} className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111] shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Aktivitas Terakhir</h2>
            <button className="text-sm text-orange-500 hover:text-orange-600 font-medium">Lihat Semua</button>
          </div>
          
          <div className="space-y-4">
            {transactions.slice(0, 5).map((trx) => (
              <div key={trx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors border border-transparent dark:border-zinc-800/50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${trx.type_transactions === 'IN' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {trx.type_transactions === 'IN' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm max-w-[200px] truncate">{trx.description || 'Tanpa Deskripsi'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(trx.entry_datetime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${trx.type_transactions === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {trx.type_transactions === 'IN' ? '+' : '-'}{formatRp(Number(trx.amount))}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${trx.is_check ? 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50'}`}>
                    {trx.is_check ? 'Verified' : 'Pending Recap'}
                  </span>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <p className="text-center text-gray-500 py-4">Belum ada transaksi nih.</p>
            )}
          </div>
        </motion.div>

        {/* Right Column: Quick Tools */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111] shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Tools</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-orange-500 dark:hover:border-orange-500 group transition-all">
                <div>
                <Link className="flex items-center gap-3" href={'/fl/dashboard/captain-only/bank/recap'}>
                  <FileText size={20} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <span className="font-medium text-sm group-hover:text-orange-500 transition-colors">Pergi ke Recap</span>
                </Link>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-orange-500" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-orange-500 dark:hover:border-orange-500 group transition-all">
                <div className="flex items-center gap-3">
                <Link className="flex items-center gap-3" href={'/fl/dashboard/captain-only/bank/statistic'}>
                  <RefreshCcw size={20} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <span className="font-medium text-sm group-hover:text-orange-500 transition-colors">Cek Statistik</span>
                </Link>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-orange-500" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}