"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowUpDown, MapPin, Edit
} from "lucide-react";
import { updateTransactionStatus } from "@/lib/services/bank-action.services";

// --- TYPES ---
export enum StatusBankEnum {
  COMPLETED = 'completed',
  PENDING = 'pending',
  CANCELED = 'canceled'
}

export interface BankTransaction {
  id: number;
  transfer_id: string;
  entry_datetime: string | Date;
  customer_name: string;
  customer_bank_account: string;
  customer_bank_name: string;
  bank_name: string;
  location: string;
  type_transactions: 'IN' | 'OUT';
  amount: number;
  description: string | null;
  status: StatusBankEnum;
  created_at: string | Date;
}

interface MutationsClientProps {
  initialData?: BankTransaction[];
}

// --- UTILS ---
const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
const formatDate = (date: string | Date) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));

// --- BADGE ---
// Gua tweak dikit opacity-nya biar di dark mode ga terlalu "neon"
const StatusBadge = ({ status }: { status: StatusBankEnum }) => {
  const styles: Record<string, string> = {
    [StatusBankEnum.COMPLETED]: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    [StatusBankEnum.PENDING]: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    [StatusBankEnum.CANCELED]: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[status] || styles['failed']}`}>{status}</span>;
};


export default function MutationsClient({ initialData = [] }: MutationsClientProps) {
  const safeInitialData = Array.isArray(initialData) ? initialData : [];

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [data] = useState<BankTransaction[]>(safeInitialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Filters
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [newStatus, setNewStatus] = useState<StatusBankEnum>(StatusBankEnum.COMPLETED);

  // --- COLUMNS ---
  const columns = useMemo<ColumnDef<BankTransaction>[]>(() => [
    {
      accessorKey: "transfer_id",
      header: ({ column }) => (
        <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          ID <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{row.getValue("transfer_id")}</div>,
    },
    {
      accessorKey: "entry_datetime",
      header: ({column}) => (
        <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Waktu <ArrowUpDown className="w-3 h-3"/>
        </button>
      ),
      cell: ({ row }) => <div className="text-xs text-slate-600 dark:text-slate-400">{formatDate(row.getValue("entry_datetime"))}</div>,
    },
    {
      accessorKey: "customer_name",
      header: "Pelanggan",
      cell: ({ row }) => {
        const originalRow = row.original;

        return (
        <div>
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{row.getValue('customer_name')}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{originalRow.customer_bank_account} ({originalRow.customer_bank_name})</div>
        </div>
    )}
    },
    {
      accessorKey: "bank_name",
      header: ({column}) => (
        <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Sumber <ArrowUpDown className="w-3 h-3"/>
        </button>
      ),
      cell: ({ row }) => <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{row.getValue("bank_name")}</div>,
    },
    {
      accessorKey: "location",
      header: "Lok",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <MapPin className="w-3 h-3" /> {row.getValue("location")}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Nominal",
      cell: ({ row }) => <div className="font-bold font-mono text-slate-800 dark:text-slate-200">{formatCurrency(row.getValue("amount"))}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <button
          onClick={() => {
            setEditingTransaction(row.original);
            setNewStatus(row.original.status);
          }}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded text-slate-500 dark:text-slate-400 transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
      ),
    },
  ], []);

  // --- FILTERING ---
const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filtered = [...data];
    if (locationFilter !== "all") filtered = filtered.filter((t) => t.location === locationFilter);
    if (statusFilter !== "all") filtered = filtered.filter((t) => t.status === statusFilter);
    
    if (globalFilter) {
      const lower = globalFilter.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.customer_bank_account.toLowerCase().includes(lower) ||
        t.customer_name.toLowerCase().includes(lower) || 
        t.customer_bank_name.toLowerCase().includes(lower)||
        t.transfer_id.toLowerCase().includes(lower)
      );
    }
    
    return filtered;
  }, [data, locationFilter, statusFilter, globalFilter]);

  // --- STATS ---
  const stats = useMemo(() => {
    const calc = (loc: string) => {
        const list = filteredData.filter(t => t.location === loc && t.type_transactions === 'OUT' && t.status === StatusBankEnum.COMPLETED);
        return { total: list.reduce((a, b) => a + b.amount, 0), count: list.length };
    };
    return { cikaret: calc("Cikaret"), sukahati: calc("Sukahati") };
  }, [filteredData]);

  // --- TABLE INSTANCE ---
  const table = useReactTable({
    data: filteredData, columns, 
    state: { sorting },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // --- ACTION ---
  const handleSave = () => {
    if (!editingTransaction) return;
    startTransition(async () => {
      try {
        await updateTransactionStatus(editingTransaction.id, newStatus);
        setEditingTransaction(null);
        router.refresh();
        alert("Status berhasil diupdate!");
      } catch (e) {
        console.error(e)
        alert("Gagal update status!");
      }
    });
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-zinc-950 min-h-screen transition-colors duration-300">
      {/* HEADER & STATS */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start">
        <div>
          <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100">Mutasi Transaksi</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor semua aliran dana</p>
        </div>
        
        {/* Simple Stats Cards */}
        <div className="flex gap-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 transition-colors">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Cikaret (OUT)</div>
                <div className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.cikaret.total)}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{stats.cikaret.count} Transaksi</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 transition-colors">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Sukahati (OUT)</div>
                <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.sukahati.total)}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{stats.sukahati.count} Transaksi</div>
            </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 mb-4 flex gap-3 flex-wrap transition-colors">
        <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500"/>
            <input 
                value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Cari..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
        </div>
        <select 
            value={locationFilter} 
            onChange={e => setLocationFilter(e.target.value)} 
            className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-sm text-slate-700 dark:text-slate-200 focus:outline-none transition-colors"
        >
            <option value="all">Semua Lokasi</option>
            <option value="Cikaret">Cikaret</option>
            <option value="Sukahati">Sukahati</option>
        </select>
        <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-sm text-slate-700 dark:text-slate-200 focus:outline-none transition-colors"
        >
            <option value="all">Semua Status</option>
            <option value="completed">Selesai</option>
            <option value="pending">Pending</option>
            <option value="canceled">Batal</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id} className="px-6 py-3 font-semibold">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {table.getRowModel().rows.length === 0 ? (
                        <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Tidak ada data ditemukan.</td></tr>
                    ) : (
                        table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="px-6 py-3">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* PAGINATION SIMPLE */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 transition-colors">
            <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex gap-2">
                <button 
                    onClick={() => table.previousPage()} 
                    disabled={!table.getCanPreviousPage()} 
                    className="px-3 py-1 border border-slate-200 dark:border-zinc-700 rounded text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    Prev
                </button>
                <button 
                    onClick={() => table.nextPage()} 
                    disabled={!table.getCanNextPage()} 
                    className="px-3 py-1 border border-slate-200 dark:border-zinc-700 rounded text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
      </div>

      {/* MODAL UPDATE */}
      <AnimatePresence>
        {editingTransaction && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{scale:0.95, opacity:0}} 
                    animate={{scale:1, opacity:1}} 
                    exit={{scale:0.95, opacity:0}} 
                    className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 dark:border-zinc-800"
                >
                    <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Edit Status</h3>
                    <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                        Ubah status untuk <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{editingTransaction.transfer_id}</span>?
                        <br/>
                        <span className="text-xs text-red-500 dark:text-red-400 mt-1 block">*Saldo akan otomatis disesuaikan.</span>
                    </div>
                    
                    <select 
                        value={newStatus} 
                        onChange={e => setNewStatus(e.target.value as StatusBankEnum)} 
                        className="w-full p-2 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-200 rounded mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="completed">Selesai (Completed)</option>
                        <option value="pending">Pending</option>
                        <option value="canceled">Batal (Canceled)</option>
                    </select>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setEditingTransaction(null)} 
                            className="flex-1 py-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={isPending} 
                            className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-900 transition-colors"
                        >
                            {isPending ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}