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
  CheckCircle2,
  Clock,
  XCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronUp,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatusBankEnum, BankTransaction, BankConfig, BankCustomer } from "@/config/type";

// --- UTILS ---
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

const formatTime = (date: string | Date) =>
  new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));

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

// --- STATUS ICON (matches the check/pending/failed markers from the reference) ---
const StatusIcon = ({ status }: { status: StatusBankEnum }) => {
  if (status === StatusBankEnum.COMPLETED) {
    return (
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2} />
      </div>
    );
  }
  if (status === StatusBankEnum.PENDING) {
    return (
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-sm shrink-0">
        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2} />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-400 dark:bg-red-500/80 flex items-center justify-center shadow-sm shrink-0">
      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2} />
    </div>
  );
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
  const [mobileRecapOpen, setMobileRecapOpen] = useState(false);

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
        .or("transfer_id.ilike.%CKT%,transfer_id.ilike.%SKH%")
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
      return {
        total: list.reduce((a, b) => a + b.amount, 0),
        count: list.length,
      };
    };
    return {
      cikaret: calc("CKT"),
      sukahati: calc("SKH"),
    };
  }, [filteredData]);

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

  // close the mobile sheet automatically once the selection is cleared
  useEffect(() => {
    if (selectedRows.length === 0) setMobileRecapOpen(false);
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

  // Shared recap content — reused by the desktop sidebar and the mobile bottom sheet
  const recapBody = (
    <>
      <div className="flex flex-col gap-2 mb-5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {selectedRows.map((d) => (
          <div key={d.id} className="py-1 border-b border-slate-100 dark:border-zinc-800/60 last:border-0">
            <div className="font-bold text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-tight truncate">
              {d.transfer_info?.customer_name}
            </div>
            <div className="text-xs flex text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
              <span>{d.transfer_info?.customer_bank_name}</span>
            </div>
            <div className="text-xs flex flex-wrap gap-x-3 text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
              <span>Uang: {formatCurrency(d.amount)}</span>
              <span>Admin: {formatCurrency(calculateAdminMargin(d.amount))}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1 text-sm bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 mb-6">
        <p className="flex justify-between items-center text-base">
          <span className="font-bold text-slate-600 dark:text-zinc-400">TOTAL UANG:</span>
          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
            {formatCurrency(totalNominal)}
          </span>
        </p>
        <p className="flex justify-between items-center text-base">
          <span className="font-bold text-slate-600 dark:text-zinc-400">TOTAL ADMIN:</span>
          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
            {formatCurrency(totalAdmin)}
          </span>
        </p>
        <p className="flex justify-between items-center text-base">
          <span className="font-bold text-slate-600 dark:text-zinc-400">TOTAL SEMUA:</span>
          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
            {formatCurrency(totalNominal + totalAdmin)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
        <button
          onClick={() => handleBulkAction("LUNAS")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm"
        >
          TANDAI LUNAS
        </button>
        <button
          onClick={() => handleBulkAction("SUKSES")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm"
        >
          TANDAI SUKSES
        </button>
        <button
          onClick={() => handleBulkAction("PENDING")}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm"
        >
          TANDAI PENDING
        </button>
        <button
          onClick={handleCetak}
          className="bg-slate-700 hover:bg-slate-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm"
        >
          CETAK KEMBALI
        </button>
        <button
          onClick={() => handleBulkAction("BATAL")}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm"
        >
          BATALKAN
        </button>
        <button
          onClick={() => handleBulkAction("HAPUS")}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm"
        >
          HAPUS DATA
        </button>
      </div>
    </>
  );

  return (
    <div
      className={`p-3 sm:p-4 lg:p-6 bg-slate-50 dark:bg-zinc-950 min-h-screen text-slate-900 dark:text-zinc-100 transition-colors duration-200 ${
        selectedRows.length > 0 ? "pb-24 lg:pb-6" : ""
      }`}
    >
      <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto">
        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          {/* HEADER & STATS */}
          <div className="mb-5 flex flex-col md:flex-row gap-4 justify-between items-start">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-zinc-100">
                Mutasi Transaksi
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 text-sm">
                Monitor semua aliran dana admin panel lu
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:flex">
              <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 min-w-0 md:min-w-[150px]">
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Cikaret (OUT)
                </div>
                <div className="text-sm sm:text-base font-mono font-bold text-purple-600 dark:text-purple-400 truncate">
                  {formatCurrency(stats.cikaret.total)}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  {stats.cikaret.count} Transaksi
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 min-w-0 md:min-w-[150px]">
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Sukahati (OUT)
                </div>
                <div className="text-sm sm:text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {formatCurrency(stats.sukahati.total)}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  {stats.sukahati.count} Transaksi
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 mb-4">
            <div className="flex flex-col gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Cari nama, rekening, ID..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3">
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

          {/* CARD LIST */}
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
                    <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur px-4 sm:px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/60">
                      {group.label}
                    </div>

                    {group.items.map((t) => {
                      const customerInfo = (t.transfer_info as BankCustomer) || ({} as BankCustomer);
                      const configInfo = (t.config_info as BankConfig) || ({} as BankConfig);
                      const isSelected = selectedIds.includes(t.id);
                      const { day, monthShort, year } = dateParts(t.entry_datetime);
                      const locationLabel = t.transfer_id.split("-")[0] === "CKT" ? "Cikaret" : "Sukahati";
                      const isOut = t.type_transactions === "OUT" ? t.status === StatusBankEnum.COMPLETED : false;

                      const customerBankRaw = (customerInfo.customer_bank_name || "").toUpperCase();
                      const sourceBankName = (configInfo.bank_name || "").toUpperCase();
                      const isRedundant = sourceBankName && customerBankRaw.includes(sourceBankName);
                      const shownCustomerBank = isRedundant ? "" : customerInfo.customer_bank_name;
                      

                      return (
                        <div
                          key={t.id}
                          className={`group flex items-start gap-2.5 sm:gap-3 px-3 sm:px-6 py-3.5 transition-colors ${
                            isSelected
                              ? "bg-blue-50/70 dark:bg-blue-500/5"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                          }`}
                        >
                          {/* checkbox */}
                          <button
                            onClick={() => toggleSelect(t.id)}
                            className="mt-1 p-1 shrink-0 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500"
                            aria-label={isSelected ? "Batalkan pilih" : "Pilih transaksi"}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          {/* date tile - hidden on very small screens to save space */}
                          <div className="hidden sm:flex flex-col items-center justify-center w-11 sm:w-12 shrink-0 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 py-1.5">
                            <div className="pb-1">
                              <StatusIcon status={t.status} />
                            </div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                              {monthShort}
                            </span>
                            <span className="text-base font-bold leading-none text-slate-700 dark:text-zinc-200">
                              {day}
                            </span>
                            <span className="text-[8px] text-slate-400 dark:text-zinc-600">{year}</span>
                          </div>

                          {/* status icon - mobile only, shown inline since the date tile is hidden */}
                          <div className="sm:hidden mt-0.5 shrink-0">
                            <StatusIcon status={t.status} />
                          </div>

                          {/* main content */}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5 sm:gap-1 overflow-hidden">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                                  {locationLabel}
                                </span>
                                {t.is_check && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-[9px] rounded font-bold border border-green-200 dark:border-green-500/20 whitespace-nowrap">
                                    LUNAS
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 whitespace-nowrap sm:hidden">
                                  {day} {monthShort} · {formatTime(t.entry_datetime)}
                                </span>
                                <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                                  {formatTime(t.entry_datetime)}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingTransaction(t);
                                  setNewStatus(t.status);
                                }}
                                className="p-1 rounded text-slate-400 dark:text-zinc-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-all shrink-0"
                                aria-label="Edit status"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="font-bold text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-tight truncate mt-0.5">
                              {customerInfo.customer_name}
                            </div>

                            <div className="text-xs text-slate-500 dark:text-zinc-500 font-mono truncate">
                              {customerInfo.customer_bank_account}
                              {shownCustomerBank && <span className="opacity-70"> ({shownCustomerBank})</span>}
                            </div>

                            <div className="mt-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                                {isOut ? (
                                  <ArrowUpCircle className="w-3 h-3" />
                                ) : (
                                  <ArrowDownCircle className="w-3 h-3" />
                                )}
                                {t.transfer_info?.customer_bank_name} - Dari ({configInfo.bank_name})
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span
                                className={`font-bold font-mono text-sm whitespace-nowrap ${
                                  isOut
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {isOut ? "-" : "+"}
                                {formatCurrency(t.amount)}
                              </span>
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
              <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 flex flex-wrap gap-3 justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-zinc-400">
                  Halaman{" "}
                  <span className="font-medium text-slate-700 dark:text-zinc-300">{pageIndex + 1}</span>{" "}
                  dari <span className="font-medium text-slate-700 dark:text-zinc-300">{pageCount}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    disabled={pageIndex === 0}
                    className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors dark:text-zinc-300"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={pageIndex >= pageCount - 1}
                    className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors dark:text-zinc-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RECAP SIDEBAR - desktop only, mobile uses the bottom sheet below */}
        {selectedRows.length > 0 && (
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm sticky top-6 h-fit max-h-[90vh] flex flex-col">
              <h3 className="text-lg font-bold mb-4 border-b border-slate-100 dark:border-zinc-800 pb-3 text-slate-800 dark:text-zinc-100">
                Terpilih: <span className="text-blue-600 dark:text-blue-500">{selectedRows.length}</span>{" "}
                Transaksi
              </h3>
              {recapBody}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE STICKY RECAP BAR */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setMobileRecapOpen(true)}
            className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-3"
          >
            <span className="text-sm font-medium">
              {selectedRows.length} transaksi dipilih
            </span>
            <span className="flex items-center gap-2 font-bold font-mono text-sm">
              {formatCurrency(totalNominal + totalAdmin)}
              <ChevronUp className="w-4 h-4" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* MOBILE RECAP BOTTOM SHEET */}
      <AnimatePresence>
        {mobileRecapOpen && selectedRows.length > 0 && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileRecapOpen(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl p-5 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                  Terpilih: <span className="text-blue-600 dark:text-blue-500">{selectedRows.length}</span>{" "}
                  Transaksi
                </h3>
                <button
                  onClick={() => setMobileRecapOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto">{recapBody}</div>
            </motion.div>
          </div>
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