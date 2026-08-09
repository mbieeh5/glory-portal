"use client";

import { useState, useMemo, useTransition, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Edit,
  Calendar,
  RefreshCw,
  CheckSquare,
  Square,
  Clock,
  Ban,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
  Plus,
  Wallet,
  CheckCheck,
  Printer,
  Trash2,
  PauseCircle,
  Landmark,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatusBankEnum, BankTransaction, BankConfig, BankCustomer, TotalAmount, TotalAmountLainLain } from "@/config/type";

// --- UTILS ---
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

const formatTime = (date: string | Date) =>
  new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));

const formatDateShort = (date: string | Date) =>
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(date)
  );

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTHS_SHORT_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const dateParts = (date: string | Date) => {
  const d = new Date(date);
  return {
    day: d.getDate(),
    monthShort: MONTHS_SHORT_ID[d.getMonth()],
    monthLong: MONTHS_ID[d.getMonth()],
    year: d.getFullYear(),
    monthKey: `${d.getFullYear()}-${d.getMonth()}`,
  };
};

// --- TRANSACTION INDICATOR (masuk / keluar / pending / batal) ---
// Four fixed states requested: money in, money out, pending, canceled.
type IndicatorColor = "emerald" | "rose" | "amber" | "slate";

const INDICATOR_STYLES: Record<
  IndicatorColor,
  { badge: string; amount: string; bar: string }
> = {
  emerald: {
    badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    amount: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  rose: {
    badge: "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    amount: "text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
  },
  amber: {
    badge: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    amount: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  slate: {
    badge: "bg-slate-200 text-slate-500 dark:bg-zinc-800 dark:text-zinc-500",
    amount: "text-slate-400 dark:text-zinc-500 line-through decoration-2",
    bar: "bg-slate-300 dark:bg-zinc-700",
  },
};

const getIndicator = (t: BankTransaction) => {
  if (t.status === StatusBankEnum.PENDING) {
    return { icon: Clock, color: "amber" as IndicatorColor, label: "Pending" };
  }
  if (t.status === StatusBankEnum.FAILED) {
    return { icon: Ban, color: "slate" as IndicatorColor, label: "Batal" };
  }
  if (t.type_transactions === "OUT") {
    return { icon: ArrowUpCircle, color: "rose" as IndicatorColor, label: "Keluar" };
  }
  return { icon: ArrowDownCircle, color: "emerald" as IndicatorColor, label: "Masuk" };
};

type SortKey = "entry_datetime" | "amount" | "transfer_id";

export default function MutationsAdmin() {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  // calculating admin margin
  const calculateAdminMargin = useCallback((amount: number): number => {
    if (amount <= 0) return 0;

    if (amount <= 500_000) return 5_000;
    if (amount <= 1_000_000) return 10_000;
    if (amount <= 3_000_000) return 15_000;
    if (amount <= 5_000_000) return 20_000;
    if (amount <= 10_000_000) return 25_000;

    const maxTier = 10_000_000;
    const maxFee = 25_000;

    const remainder = amount - maxTier;
    return maxFee + calculateAdminMargin(remainder);
  }, []);

  // Data State
  const [data, setData] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Sort & pagination (manual, since we render cards instead of a <table>)
  const [sortKey, setSortKey] = useState<SortKey>("entry_datetime");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const PAGE_SIZE = 30;

  // Filters
  const [globalFilter, setGlobalFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [fabOpen, setFabOpen] = useState(false);

  // Saldo per bank dropdown state
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [expandedIntBanks, setExpandedIntBanks] = useState<Set<string>>(new Set());

  const toggleBankExpand = (bankId: string) => {
    setExpandedBanks((prev) => {
      const next = new Set(prev);
      if (next.has(bankId)) next.delete(bankId);
      else next.add(bankId);
      return next;
    });
  };

  const toggleIntExpand = (bankId: string) => {
    setExpandedIntBanks((prev) => {
      const next = new Set(prev);
      if (next.has(bankId)) next.delete(bankId);
      else next.add(bankId);
      return next;
    });
  };

  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [newStatus, setNewStatus] = useState<StatusBankEnum>(StatusBankEnum.COMPLETED);

  // --- FETCH DATA ---
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: transactions, error } = await supabase
        .schema("glory")
        .from("bank_transactions")
        .select(`
          *,
          transfer_info: bank_customers (
            customer_name,
            customer_bank_account,
            customer_bank_name
          ),
          config_info: bank_config (
            bank_name
          )
        `)
        .order("entry_datetime", { ascending: false });

      if (error) throw error;

      // Casting manual karena Supabase join types kadang tricky
      setData((transactions as unknown as BankTransaction[]) || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      alert("Gagal load data!");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel("bank_transactions_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "glory", table: "bank_transactions" },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions, supabase]);

  // reset ke halaman 1 tiap kali filter berubah biar ga nyasar ke halaman kosong
  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter, locationFilter, statusFilter, startDate, endDate]);

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filtered = [...data];

    if (locationFilter !== "all") {
      filtered = filtered.filter((t) => t.transfer_id.split("-")[0] === locationFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.entry_datetime) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(
        (t) => new Date(t.entry_datetime) <= new Date(endDate + "T23:59:59")
      );
    }

    if (globalFilter) {
      const lower = globalFilter.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.transfer_info?.customer_bank_account.toLowerCase().includes(lower) ||
          t.transfer_info?.customer_name.toLowerCase().includes(lower) ||
          t.transfer_info?.customer_bank_name.toLowerCase().includes(lower) ||
          t.transfer_id.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [data, locationFilter, statusFilter, globalFilter, startDate, endDate]);

  // --- SORTING ---
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "entry_datetime") {
        cmp = new Date(a.entry_datetime).getTime() - new Date(b.entry_datetime).getTime();
      } else if (sortKey === "amount") {
        cmp = a.amount - b.amount;
      } else {
        cmp = a.transfer_id.localeCompare(b.transfer_id);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredData, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };
  void toggleSort;

  // --- PAGINATION ---
  const pageCount = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const paginatedData = useMemo(
    () => sortedData.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE),
    [sortedData, pageIndex]
  );

  // --- GROUP BY MONTH (mirrors the "Juli" header from the reference) ---
  const groupedData = useMemo(() => {
    const groups: { key: string; label: string; items: BankTransaction[] }[] = [];
    for (const t of paginatedData) {
      const { monthKey, monthLong, year } = dateParts(t.entry_datetime);
      const label = `${monthLong} ${year}`;
      const last = groups[groups.length - 1];
      if (last && last.key === monthKey) {
        last.items.push(t);
      } else {
        groups.push({ key: monthKey, label, items: [t] });
      }
    }
    return groups;
  }, [paginatedData]);

  // --- STATS ---
  const stats = useMemo(() => {
    const calc = (loc: string) => {
      const list = filteredData.filter(
        (t) =>
          t.transfer_id.split("-")[0] === loc &&
          t.type_transactions === "OUT" &&
          t.status === StatusBankEnum.COMPLETED
      );
      const dataPending = filteredData.filter(
        (p) =>
          p.transfer_id.split("-")[0] === loc &&
          p.type_transactions === "OUT" &&
          p.status === StatusBankEnum.PENDING
      )
      return {
        total: list.reduce((a, b) => a + b.amount, 0),
        total_pending: dataPending.reduce((a,b) => a + b.amount, 0),
        count_pending: dataPending.length,
        count: list.length,
      };
    };
    return {
      cikaret: calc("CKT"),
      sukahati: calc("SKH")
    };
  }, [filteredData]);

  // --- SALDO PER BANK (saldo awal & saldo akhir, ngikut filter yang aktif) ---
  // Saldo awal = balance_before dari transaksi PALING AWAL di rentang filter, per bank.
  // Saldo akhir = balance_after dari transaksi PALING AKHIR di rentang filter, per bank.
  // Daftar bank diambil dari seluruh data (bukan cuma yang kefilter) biar bank yang gak ada
  // transaksi di rentang tsb tetep muncul dengan keterangan kosong.
  const isDateFilterActive = Boolean(startDate || endDate);

  const bankBalances = useMemo(() => {
    const bankMap = new Map<string, string>(); // bank_id -> bank_name
    data.forEach((t) => {
      const id = t.bank_id ?? "unknown";
      const name = t.config_info?.bank_name || "Bank Tidak Diketahui";
      if (!bankMap.has(id)) bankMap.set(id, name);
    });

    return Array.from(bankMap.entries())
      .map(([bankId, bankName]) => {
        const bankTx = filteredData
          .filter((t) => (t.bank_id ?? "unknown") === bankId)
          .sort((a, b) => new Date(a.entry_datetime).getTime() - new Date(b.entry_datetime).getTime());

        if (bankTx.length === 0) {
          return {
            bankId,
            bankName,
            hasData: false,
            saldoAwal: null as number | null,
            saldoAkhir: null as number | null,
            tanggalAwal: null as Date | null,
            tanggalAkhir: null as Date | null,
            count: 0,
            CKTLength: [] as TotalAmount[],
            SKHLength: [] as TotalAmount[],
            intTx: [] as BankTransaction[],
            CKTAmount: 0,
            SKHAmount: 0,
            pemakaianTransaksi: 0,
            notaTransaksi: 0,
            pemakaianLainLain: 0,
          };
        }

        const first = bankTx[0];
        const last = bankTx[bankTx.length - 1];

          // reduction
          const amountTotal = bankTx.reduce<TotalAmount>((acc, t)=> {
            if(t.transfer_id.includes("CKT")) {
              acc.CKT += t.amount;
              acc.CKTLength +=1;
            }else if(t.transfer_id.includes("SKH")) {
              acc.SKH += t.amount;
              acc.SKHLength += 1;
            }
            return acc

          },{CKT: 0,CKTLength: 0, SKH: 0,SKHLength: 0 })
        
        // Pemakaian 2: lain-lain / transfer internal (transfer_id mengandung INT)
        const intTx = [...bankTx]
          .filter((t) => t.transfer_id.includes("INT"))
          .sort((a, b) => new Date(b.entry_datetime).getTime() - new Date(a.entry_datetime).getTime());

        // reduction for lain lain
        const amountTotalLainLain = intTx.reduce<TotalAmountLainLain>((acc, t) => {
          acc.intLength += 1
          acc.intAmount += t.amount;
          return acc
        },{intLength: 0, intAmount: 0})

        return {
          bankId,
          bankName,
          hasData: true,
          saldoAwal: first.balance_before,
          saldoAkhir: last.balance_after,
          tanggalAwal: first.entry_datetime,
          tanggalAkhir: last.entry_datetime,
          count: bankTx.length,
          CKTLength : amountTotal.CKTLength,
          SKHLength : amountTotal.SKHLength,
          intTx,
          CKTAmount: amountTotal.CKT,
          SKHAmount: amountTotal.SKH,
          pemakaianTransaksi: amountTotal.CKT + amountTotal.SKH,
          notaTransaksi: amountTotal.CKTLength + amountTotal.SKHLength,
          pemakaianLainLain: amountTotalLainLain.intAmount,
        };
      })
      .sort((a, b) => a.bankName.localeCompare(b.bankName));
  }, [data, filteredData]);

  // --- SELECTED ROWS CALC ---
  const selectedRows = useMemo(() => {
    return data.filter((t) => selectedIds.includes(t.id));
  }, [selectedIds, data]);

  const totalAdmin = useMemo(() => {
    return selectedRows.reduce((sum, t) => sum + calculateAdminMargin(t.amount), 0);
  }, [selectedRows, calculateAdminMargin]);

  const totalNominal = useMemo(() => {
    return selectedRows.reduce((sum, t) => sum + t.amount, 0);
  }, [selectedRows]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // close the floating panel automatically once the selection is cleared
  useEffect(() => {
    if (selectedRows.length === 0) setFabOpen(false);
  }, [selectedRows.length]);

  // --- ACTIONS ---
  const handleSave = async () => {
    if (!editingTransaction) return;

    startTransition(async () => {
      try {
        const { error } = await supabase
          .schema("glory")
          .from("bank_transactions")
          .update({ status: newStatus })
          .eq("id", editingTransaction.id);

        if (error) throw error;

        setEditingTransaction(null);
        await fetchTransactions();
        alert("Status berhasil diupdate!");
      } catch (e) {
        console.error(e);
        alert("Gagal update status!");
      }
    });
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      alert("Pilih transaksi dulu!");
      return;
    }

    const confirmed = confirm(`Yakin mau ${action} ${selectedIds.length} transaksi?`);
    if (!confirmed) return;

    startTransition(async () => {
      try {
        let updateData: Partial<BankTransaction> = {};

        switch (action) {
          case "LUNAS":
            updateData = { is_check: true };
            break;
          case "SUKSES":
            updateData = { status: StatusBankEnum.COMPLETED, is_check: false };
            break;
          case "PENDING":
            updateData = { status: StatusBankEnum.PENDING };
            break;
          case "BATAL":
            updateData = { status: StatusBankEnum.FAILED };
            break;
          case "HAPUS": {
            const { error: deleteError } = await supabase
              .schema("glory")
              .from("bank_transactions")
              .delete()
              .in("id", selectedIds);

            if (deleteError) throw deleteError;

            setSelectedIds([]);
            await fetchTransactions();
            alert(`${selectedIds.length} transaksi berhasil dihapus!`);
            return;
          }
        }

        const { error } = await supabase
          .schema("glory")
          .from("bank_transactions")
          .update(updateData)
          .in("id", selectedIds);

        if (error) throw error;

        setSelectedIds([]);
        await fetchTransactions();
        alert(`${selectedIds.length} transaksi berhasil di-${action}!`);
      } catch (e) {
        console.error(e);
        alert(`Gagal ${action} transaksi!`);
      }
    });
  };

  const handleCetak = () => {
    if (selectedIds.length === 0) {
      alert("Pilih transaksi dulu!");
      return;
    }
    alert(`Cetak ${selectedIds.length} transaksi - Coming soon!`);
  };

  // Compact bulk-action buttons shown inside the floating FAB panel
  const fabActions: { label: string; icon: typeof CheckCheck; action: string; className: string }[] = [
    { label: "Lunas", icon: CheckCheck, action: "LUNAS", className: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Sukses", icon: Wallet, action: "SUKSES", className: "bg-blue-600 hover:bg-blue-700" },
    { label: "Pending", icon: PauseCircle, action: "PENDING", className: "bg-amber-500 hover:bg-amber-600" },
    { label: "Cetak", icon: Printer, action: "CETAK", className: "bg-slate-700 hover:bg-slate-800 dark:bg-zinc-700 dark:hover:bg-zinc-600" },
    { label: "Batalkan", icon: Ban, action: "BATAL", className: "bg-orange-500 hover:bg-orange-600" },
    { label: "Hapus", icon: Trash2, action: "HAPUS", className: "bg-red-500 hover:bg-red-600" },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-slate-50 dark:bg-zinc-950 min-h-screen text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      <div className="max-w-screen-2xl mx-auto">
        {/* HEADER & STATS */}
        <div className="mb-4 flex flex-col md:flex-row gap-3 justify-between items-start">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-zinc-100">
              Mutasi Transaksi
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 text-xs">
              Monitor semua aliran dana admin panel lu
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex">
            <div className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 min-w-0 md:min-w-[130px]">
              <div className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider">
                Cikaret (OUT)
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-purple-600 dark:text-purple-400 truncate">
                {formatCurrency(stats.cikaret.total)}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                {stats.cikaret.count} Transaksi
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 min-w-0 md:min-w-[130px]">
              <div className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider">
                Sukahati (OUT)
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {formatCurrency(stats.sukahati.total)}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                {stats.sukahati.count} Transaksi
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 min-w-0 md:min-w-[130px]">
              <div className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider">
                Pending (HOLD)
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-amber-600 dark:text-amber-400 truncate">
                {formatCurrency(stats.sukahati.total_pending + stats.cikaret.total_pending)}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                {stats.sukahati.count_pending + stats.cikaret.count_pending} Transaksi
              </div>
            </div>
          </div>
        </div>

        {/* SALDO PER BANK — saldo awal & saldo akhir, otomatis ngikut filter tanggal/lokasi/status di bawah */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 mb-3 overflow-hidden">
          <div className="px-3 sm:px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <h2 className="text-sm font-bold text-slate-700 dark:text-zinc-200">Saldo per Bank</h2>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
              {isDateFilterActive
                ? `${startDate || "awal data"} — ${endDate || "sekarang"}`
                : "Semua data (belum difilter tanggal)"}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {bankBalances.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-zinc-500">
                Belum ada data bank.
              </div>
            ) : (
              bankBalances.map((b) => {
                const isExpanded = expandedBanks.has(b.bankId);
                const isIntExpanded = expandedIntBanks.has(b.bankId);

                return (
                  <div key={b.bankId}>
                    <div
                      onClick={() => b.hasData && toggleBankExpand(b.bankId)}
                      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 transition-colors ${
                        b.hasData ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-zinc-400">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase truncate">
                              {b.bankName}
                            </span>
                            {b.hasData && (
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform shrink-0 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                            {b.hasData ? `${b.count} transaksi di rentang ini` : "Tidak ada transaksi pada rentang ini"}
                          </div>
                        </div>
                      </div>

                      {b.hasData ? (
                        <div className="grid grid-cols-2 sm:flex sm:gap-6 gap-x-4 gap-y-2 pl-11 sm:pl-0 shrink-0">
                          <div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold">
                              Saldo Awal
                            </div>
                            <div className="font-mono font-bold text-sm text-slate-700 dark:text-zinc-200 whitespace-nowrap">
                              {b.saldoAwal != null ? formatCurrency(b.saldoAwal) : "-"}
                            </div>
                            {b.tanggalAwal && (
                              <div className="text-[10px] text-slate-400 dark:text-zinc-600 whitespace-nowrap">
                                {formatDateShort(b.tanggalAwal)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold">
                              Pemakaian Transaksi
                            </div>
                            <div className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400 whitespace-nowrap">
                              Rp {b.pemakaianTransaksi.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold">
                              Lain-lain
                            </div>
                            <div className="font-mono font-bold text-sm text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                              Rp {b.pemakaianLainLain.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold">
                              Saldo Akhir
                            </div>
                            <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              {b.saldoAkhir != null ? formatCurrency(b.saldoAkhir) : "-"}
                            </div>
                            {b.tanggalAkhir && (
                              <div className="text-[10px] text-slate-400 dark:text-zinc-600 whitespace-nowrap">
                                {formatDateShort(b.tanggalAkhir)}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="pl-11 sm:pl-0 shrink-0">
                          <span className="text-[11px] italic text-slate-400 dark:text-zinc-600">
                            Bank {b.bankName} tidak ada transaksi
                          </span>
                        </div>
                      )}
                    </div>

                    {/* DROPDOWN — rincian per lokasi + lain-lain */}
                    <AnimatePresence>
                      {isExpanded && b.hasData && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-slate-50/60 dark:bg-zinc-950/40"
                        >
                          <div className="px-3 sm:px-4 py-3 pl-11 sm:pl-14 space-y-1.5">
                            <div className="flex items-center justify-between text-xs py-1">
                              <span className="text-slate-500 dark:text-zinc-400">Cikaret (CKT)</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">
                               Rp {b.CKTAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs py-1">
                              <span className="text-slate-500 dark:text-zinc-400">Sukahati (SKH)</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">
                               Rp {b.SKHAmount.toLocaleString()}
                              </span>
                            </div>

                            {/* NESTED DROPDOWN — mutasi lain-lain (INT) */}
                            <div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleIntExpand(b.bankId);
                                }}
                                className="w-full flex items-center justify-between text-xs py-1"
                              >
                                <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                                  Lain-lain (INT)
                                  <ChevronDown
                                    className={`w-3 h-3 transition-transform ${isIntExpanded ? "rotate-180" : ""}`}
                                  />
                                </span>
                                <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">
                                 Rp {b.pemakaianLainLain.toLocaleString()}
                                </span>
                              </button>

                              <AnimatePresence>
                                {isIntExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-1.5 mb-1 rounded-lg border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900 max-h-64 overflow-y-auto custom-scrollbar">
                                      {b.intTx.length === 0 ? (
                                        <div className="px-3 py-3 text-center text-[11px] text-slate-400 dark:text-zinc-500">
                                          Tidak ada transaksi lain-lain.
                                        </div>
                                      ) : (
                                        b.intTx.map((t) => {
                                          const tIndicator = getIndicator(t);
                                          const tStyle = INDICATOR_STYLES[tIndicator.color];
                                          const TIcon = tIndicator.icon;
                                          const tIsOut = t.type_transactions === "OUT";
                                          const { day, monthShort } = dateParts(t.entry_datetime);

                                          return (
                                            <div key={t.id} className="flex items-center gap-2.5 px-3 py-2">
                                              <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${tStyle.badge}`}
                                              >
                                                <TIcon className="w-3 h-3" strokeWidth={2} />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">
                                                  {t.description || t.transfer_id}
                                                </div>
                                                <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                                                  {day} {monthShort} · {formatTime(t.entry_datetime)}
                                                </div>
                                              </div>
                                              <div
                                                className={`text-xs font-mono font-bold whitespace-nowrap ${tStyle.amount}`}
                                              >
                                                {tIsOut ? "-" : "+"}
                                                {formatCurrency(t.amount)}
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 mb-3">
          <div className="flex flex-col gap-2.5">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Cari nama, rekening, ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2.5">
              <div className="flex gap-2 items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 sm:col-span-2 lg:col-span-1">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 min-w-0 py-2 bg-transparent text-sm text-slate-900 dark:text-zinc-100 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                />
                <span className="text-slate-400 dark:text-zinc-600 shrink-0">—</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 min-w-0 py-2 bg-transparent text-sm text-slate-900 dark:text-zinc-100 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-auto"
              >
                <option value="all">Semua Lokasi</option>
                <option value="CKT">Cikaret</option>
                <option value="SKH">Sukahati</option>
              </select>

              <div className="flex gap-2 w-full lg:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 lg:flex-none px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="completed">Selesai</option>
                  <option value="pending">Pending</option>
                  <option value="canceled">Batal</option>
                </select>

                <button
                  onClick={fetchTransactions}
                  disabled={loading}
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 disabled:opacity-50 transition-colors shrink-0"
                  aria-label="Muat ulang data"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LEGEND — quick key for the indicator dots */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 px-1 text-[11px] text-slate-500 dark:text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Masuk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Keluar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-700" /> Batal
          </span>
        </div>

        {/* CARD LIST — full width always, no sidebar ever pushes it */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="px-6 py-20 text-center text-slate-500 dark:text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
              <p className="font-medium">Loading data...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500 dark:text-zinc-500">
              Tidak ada data ditemukan bro.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {groupedData.map((group) => (
                <div key={group.key}>
                  {/* MONTH DIVIDER */}
                  <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur px-3 sm:px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/60">
                    {group.label}
                  </div>

                  {group.items.map((t) => {
                    const customerInfo = (t.transfer_info as BankCustomer) || ({} as BankCustomer);
                    const configInfo = (t.config_info as BankConfig) || ({} as BankConfig);
                    const isSelected = selectedIds.includes(t.id);
                    const { day, monthShort } = dateParts(t.entry_datetime);
                    const locationLabel = t.transfer_id.split("-")[0] === "CKT" ? "Cikaret" : "Sukahati";
                    const isOut = t.type_transactions === "OUT";

                    const customerBankRaw = (customerInfo.customer_bank_name || "").toUpperCase();
                    const sourceBankName = (configInfo.bank_name || "").toUpperCase();
                    const isRedundant = sourceBankName && customerBankRaw.includes(sourceBankName);
                    const shownCustomerBank = isRedundant ? "" : customerInfo.customer_bank_name;

                    const indicator = getIndicator(t);
                    const style = INDICATOR_STYLES[indicator.color];
                    const Icon = indicator.icon;

                    return (
                      <div
                        key={t.id}
                        className={`group flex items-center gap-2 sm:gap-3 pl-0 pr-3 sm:pr-4 py-2 transition-colors ${
                          isSelected
                            ? "bg-blue-50/70 dark:bg-blue-500/5"
                            : "hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        {/* accent bar = instant visual read of direction/status */}
                        <span className={`w-1 self-stretch my-1 rounded-full shrink-0 ${style.bar}`} />

                        {/* checkbox */}
                        <button
                          onClick={() => toggleSelect(t.id)}
                          className="p-1 shrink-0 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500"
                          disabled={t.status === StatusBankEnum.FAILED}
                          aria-label={isSelected ? "Batalkan pilih" : "Pilih transaksi"}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        {/* indicator badge */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.badge}`}
                          title={indicator.label}
                        >
                          <Icon className="w-4 h-4" strokeWidth={2} />
                        </div>

                        {/* main content — single compact block */}
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-tight truncate">
                                {t.transfer_id.includes("INT") && !customerInfo.customer_name ? t.description : customerInfo.customer_name}
                              </span>
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                                {locationLabel}
                              </span>
                              {t.is_check && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-[9px] rounded font-bold border border-green-200 dark:border-green-500/20 whitespace-nowrap">
                                  LUNAS
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-zinc-500 font-mono truncate">
                              {customerInfo.customer_bank_account}
                              {shownCustomerBank && <span className="opacity-70"> ({shownCustomerBank})</span>}
                              <span className="opacity-60"> · {configInfo.bank_name}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-1.5">
                            <div>
                              <div className={`font-bold font-mono text-sm whitespace-nowrap ${style.amount}`}>
                                {isOut ? "-" : "+"}
                                {formatCurrency(t.amount)}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                                {day} {monthShort} · {formatTime(t.entry_datetime)}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingTransaction(t);
                                setNewStatus(t.status);
                              }}
                              disabled={t.status === StatusBankEnum.FAILED}
                              className="p-1.5 rounded text-slate-400 dark:text-zinc-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-all shrink-0"
                              aria-label="Edit status"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {!loading && paginatedData.length > 0 && (
            <div className="px-3 sm:px-4 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 flex flex-wrap gap-3 justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Halaman{" "}
                <span className="font-medium text-slate-700 dark:text-zinc-300">{pageIndex + 1}</span>{" "}
                dari <span className="font-medium text-slate-700 dark:text-zinc-300">{pageCount}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={pageIndex === 0}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors dark:text-zinc-300"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={pageIndex >= pageCount - 1}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors dark:text-zinc-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING ACTION BUTTON — replaces the old sidebar/sticky-bar so the table never loses width */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 sm:bottom-5 sm:right-5 z-40"
          >
            {/* floating panel */}
            <AnimatePresence>
              {fabOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  className="absolute bottom-16 right-0 w-[calc(100vw-2.5rem)] max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 max-h-[75vh] flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                      Terpilih: <span className="text-blue-600 dark:text-blue-500">{selectedRows.length}</span>
                    </h3>
                    <button
                      onClick={() => setFabOpen(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                      aria-label="Tutup"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedRows.map((d) => (
                      <div key={d.id} className="py-1 border-b border-slate-100 dark:border-zinc-800/60 last:border-0">
                        <div className="font-bold text-xs text-slate-800 dark:text-zinc-100 uppercase truncate">
                          {d.transfer_info?.customer_name}
                        </div>
                        <div className="text-[11px] flex flex-wrap gap-x-2 text-slate-500 dark:text-zinc-500 font-mono">
                          <span>{formatCurrency(d.amount)}</span>
                          <span className="opacity-70">+admin {formatCurrency(calculateAdminMargin(d.amount))}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 text-xs bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 mb-3">
                    <p className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600 dark:text-zinc-400">Total Uang</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalNominal)}</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600 dark:text-zinc-400">Total Admin</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalAdmin)}</span>
                    </p>
                    <p className="flex justify-between items-center text-sm pt-1 border-t border-slate-200 dark:border-zinc-800">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">Total Semua</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(totalNominal + totalAdmin)}
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {fabActions.map(({ label, icon: ActionIcon, action, className }) => (
                      <button
                        key={action}
                        onClick={() => (action === "CETAK" ? handleCetak() : handleBulkAction(action))}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-white shadow-sm transition-all ${className}`}
                      >
                        <ActionIcon className="w-4 h-4" />
                        <span className="text-[10px] font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FAB button itself */}
            <button
              onClick={() => setFabOpen((o) => !o)}
              className="relative w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
              aria-label="Buka aksi transaksi"
            >
              <motion.div animate={{ rotate: fabOpen ? 135 : 0 }} transition={{ duration: 0.2 }}>
                <Plus className="w-6 h-6" />
              </motion.div>
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-50 dark:border-zinc-950">
                {selectedRows.length}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL UPDATE STATUS */}
      <AnimatePresence>
        {editingTransaction && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-zinc-100">Edit Status</h3>
              <div className="mb-5 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Ubah status untuk ID{" "}
                <span className="font-mono font-bold text-slate-900 dark:text-blue-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {editingTransaction.transfer_id}
                </span>
                ?
                <br />
                <span className="text-xs text-red-500 dark:text-red-400 mt-2 block font-medium">
                  *Saldo akan otomatis disesuaikan.
                </span>
              </div>

              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as StatusBankEnum)}
                className="w-full p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="completed">Selesai (Completed)</option>
                <option value="pending">Pending</option>
                <option value="canceled">Batal (Canceled)</option>
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors shadow-sm"
                >
                  {isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.5);
          border-radius: 9999px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
        }
      `}</style>
    </div>
  );
}