"use client";

import { useState, useMemo, useTransition, useEffect, useCallback } from "react";
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
  Search, ArrowUpDown, Edit, Calendar, RefreshCw, CheckSquare, Square
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatusBankEnum, BankTransaction, BankConfig, BankCustomer } from "@/config/type";

// --- UTILS ---
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(value);

const formatDate = (date: string | Date) => 
  new Intl.DateTimeFormat('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).format(new Date(date));

// --- BADGE ---
const StatusBadge = ({ status }: { status: StatusBankEnum }) => {
  const styles: Record<string, string> = {
    [StatusBankEnum.COMPLETED]: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    [StatusBankEnum.PENDING]: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    [StatusBankEnum.FAILED]: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};

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
  
  // Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Filters
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [newStatus, setNewStatus] = useState<StatusBankEnum>(StatusBankEnum.COMPLETED);

  // --- FETCH DATA ---
const fetchTransactions = useCallback(async () => {
  setLoading(true);
  try {
    const { data: transactions, error } = await supabase
      .schema('glory')
      .from('bank_transactions')
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
      .or('transfer_id.ilike.%CKT%,transfer_id.ilike.%SKH%')
      .order('entry_datetime', { ascending: false });

    if (error) throw error;
    
    // Casting manual karena Supabase join types kadang tricky
    setData((transactions as unknown as BankTransaction[]) || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    alert('Gagal load data!');
  } finally {
    setLoading(false);
  }
}, [supabase]); // Supabase masuk sini

useEffect(() => {
  fetchTransactions();

  const channel = supabase
    .channel('bank_transactions_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'glory', table: 'bank_transactions' },
      () => {
        fetchTransactions();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [fetchTransactions, supabase]);

  // --- COLUMNS ---
  const columns = useMemo<ColumnDef<BankTransaction>[]>(() => [
    {
      id: "select",
      header: ({ table }) => {
        const allSelected = table.getRowModel().rows.length > 0 && 
          table.getRowModel().rows.every(row => selectedIds.includes(row.original.id));
        
        return (
          <button
            onClick={() => {
              if (allSelected) {
                setSelectedIds([]);
              } else {
                setSelectedIds(table.getRowModel().rows.map(r => r.original.id));
              }
            }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-500 dark:text-zinc-400"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-500" /> : <Square className="w-4 h-4" />}
          </button>
        );
      },
      cell: ({ row }) => {
        const isSelected = selectedIds.includes(row.original.id);
        return (
          <button
            onClick={() => {
              setSelectedIds(prev =>
                isSelected
                  ? prev.filter(id => id !== row.original.id)
                  : [...prev, row.original.id]
              );
            }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-500 dark:text-zinc-400"
          >
            {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-500" /> : <Square className="w-4 h-4" />}
          </button>
        );
      },
    },
    {
      accessorKey: "transfer_id",
      header: ({ column }) => (
        <button 
          className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">
            {(row.getValue("transfer_id")as string)?.split('-')[0] === 'CKT' ? "Cikaret" : "Sukahati"}
          </div>
          {row.original.is_check && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-[10px] rounded font-bold border border-green-200 dark:border-green-500/20">
              LUNAS
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "entry_datetime",
      header: ({ column }) => (
        <button 
          className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Waktu <ArrowUpDown className="w-3 h-3"/>
        </button>
      ),
      cell: ({ row }) => <div className="text-xs text-slate-600 dark:text-zinc-400">{formatDate(row.getValue("entry_datetime"))}</div>,
    },
    {
      accessorKey: "transfer_info",
      header: "Pelanggan",
      cell: ({ row }) => {
        const customerInfo = (row.original.transfer_info) as BankCustomer || {};
        const configInfo = (row.original.config_info) as BankConfig || {};
        
        // Ambil string mentahnya, paksa jadi UPPERCASE biar sinkron
        const customerBankRaw = (customerInfo.customer_bank_name || "").toUpperCase();
        const sourceBankName = (configInfo.bank_name || "").toUpperCase();

        // LOGIKA: Sembunyiin kalo nama bank customer mengandung nama bank di sumber (MANDIRI, BRI, dll)
        // ATAU mengandung keyword umum yang lu mau ilangin.
        const isRedundant = sourceBankName && customerBankRaw.includes(sourceBankName);
        
        // Kalo sumbernya beda jauh (misal: DANAMON vs BTN), isRedundant bakal False, jadi muncul.
        const sanitizerCustomerBank = isRedundant ? "" : customerInfo.customer_bank_name;

        return (
          <div className="py-1">
            <div className="font-bold text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-tight">
              {customerInfo.customer_name}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
              <span>{customerInfo.customer_bank_account}</span>
              {sanitizerCustomerBank && (
                <span className="ml-1 opacity-70">
                  ({sanitizerCustomerBank})
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "config_info",
      header: 'Sumber',
      cell: ({ row }) => <div className="text-xs font-medium text-slate-700 dark:text-zinc-300">{(row.getValue("config_info") as unknown as BankConfig)?.bank_name}</div>,
    },
    {
        accessorKey: "balance_before",
        header: "Saldo Sebelum",
        size: 20,
        minSize: 20,
        maxSize: 25,
        cell: ({ row }) => (
            <div className="font-light font-mono text-slate-600 dark:text-zinc-400">
                {formatCurrency(row.getValue('balance_before'))}
            </div>
        ),
    },
    {
      accessorKey: "amount",
      header: "Nominal",
      cell: ({ row }) => (
        <div className="font-bold font-mono text-slate-800 dark:text-zinc-100">
          {formatCurrency(row.getValue("amount"))}
        </div>
      ),
    },
    {
        accessorKey: "balance_after",
        header: "Saldo Sesudah",
        cell: ({ row }) => (
            <div className="font-light font-mono text-slate-600 dark:text-zinc-400">
                {formatCurrency(row.getValue('balance_after'))}
            </div>
        )
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
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-500 dark:text-zinc-400 transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
      ),
    },
  ], [selectedIds]);

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filtered = [...data];
    
    if (locationFilter !== "all") {
      filtered = filtered.filter((t) => t.transfer_id.split('-')[0] === locationFilter);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    
    if (startDate) {
      filtered = filtered.filter((t) => 
        new Date(t.entry_datetime) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter((t) => 
        new Date(t.entry_datetime) <= new Date(endDate + 'T23:59:59')
      );
    }
    
    if (globalFilter) {
      const lower = globalFilter.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.transfer_info?.customer_bank_account.toLowerCase().includes(lower) ||
        t.transfer_info?.customer_name.toLowerCase().includes(lower) || 
        t.transfer_info?.customer_bank_name.toLowerCase().includes(lower) ||
        t.transfer_id.toLowerCase().includes(lower)
      );
    }
    
    return filtered;
  }, [data, locationFilter, statusFilter, globalFilter, startDate, endDate]);

  // --- STATS ---
  const stats = useMemo(() => {
    const calc = (loc: string) => {
      const list = filteredData.filter(
        t => t.transfer_id.split('-')[0] === loc && 
        t.type_transactions === 'OUT' && 
        t.status === StatusBankEnum.COMPLETED
      );
      return { 
        total: list.reduce((a, b) => a + b.amount, 0), 
        count: list.length 
      };
    };
    return { 
      cikaret: calc("CKT"), 
      sukahati: calc("SKH") 
    };
  }, [filteredData]);

  // --- SELECTED ROWS CALC ---
  const selectedRows = useMemo(() => {
    return data.filter(t => selectedIds.includes(t.id));
  }, [selectedIds, data]);

  const totalAdmin = useMemo(() => {
    return selectedRows.reduce((sum, t) => sum + calculateAdminMargin(t.amount), 0)
  },[selectedRows, calculateAdminMargin])

  const totalNominal = useMemo(() => {
    return selectedRows.reduce((sum, t) => sum + t.amount, 0);
  }, [selectedRows]);

  // --- TABLE INSTANCE ---
  const table = useReactTable({
    data: filteredData, 
    columns, 
    state: { sorting },
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(), 
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(), 
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  // --- ACTIONS ---
  const handleSave = async () => {
    if (!editingTransaction) return;
    
    startTransition(async () => {
      try {
        const { error } = await supabase
        .schema('glory')
          .from('bank_transactions')
          .update({ status: newStatus })
          .eq('id', editingTransaction.id);

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

    const confirmed = confirm(
      `Yakin mau ${action} ${selectedIds.length} transaksi?`
    );
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
          case "HAPUS":
            const { error: deleteError } = await supabase
            .schema('glory')
              .from('bank_transactions')
              .delete()
              .in('id', selectedIds);
            
            if (deleteError) throw deleteError;
            
            setSelectedIds([]);
            await fetchTransactions();
            alert(`${selectedIds.length} transaksi berhasil dihapus!`);
            return;
        }

        const { error } = await supabase
        .schema('glory')
          .from('bank_transactions')
          .update(updateData)
          .in('id', selectedIds);

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

  return (
    <div className="p-4 bg-slate-50 dark:bg-zinc-950 min-h-screen text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto">
        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          {/* HEADER & STATS */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-zinc-100">Mutasi Transaksi</h1>
              <p className="text-slate-500 dark:text-zinc-400 text-sm">Monitor semua aliran dana admin panel lu</p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 flex-1 min-w-[160px]">
                <div className="text-xs text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">Cikaret (OUT)</div>
                <div className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(stats.cikaret.total)}
                </div>
                <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{stats.cikaret.count} Transaksi</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 flex-1 min-w-[160px]">
                <div className="text-xs text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">Sukahati (OUT)</div>
                <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(stats.sukahati.total)}
                </div>
                <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{stats.sukahati.count} Transaksi</div>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 mb-6">
            <div className="flex gap-3 flex-wrap items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500"/>
                <input 
                  value={globalFilter} 
                  onChange={e => setGlobalFilter(e.target.value)}
                  placeholder="Cari nama, rekening, ID..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Date Range */}
              <div className="flex gap-2 items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="py-2 bg-transparent text-sm text-slate-900 dark:text-zinc-100 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                />
                <span className="text-slate-400 dark:text-zinc-600">—</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="py-2 bg-transparent text-sm text-slate-900 dark:text-zinc-100 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {/* Location Filter */}
              <select 
                value={locationFilter} 
                onChange={e => setLocationFilter(e.target.value)} 
                className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Lokasi</option>
                <option value="CKT">Cikaret</option>
                <option value="SKH">Sukahati</option>
              </select>

              {/* Status Filter */}
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)} 
                className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="completed">Selesai</option>
                <option value="pending">Pending</option>
                <option value="canceled">Batal</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchTransactions}
                disabled={loading}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
            {loading ? (
              <div className="px-6 py-20 text-center text-slate-500 dark:text-zinc-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                <p className="font-medium">Loading data...</p>
              </div>
            ) : (
              <>
                <div className="overflow-auto max-h-[60vh] custom-scrollbar relative">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase text-xs tracking-wider">
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th key={header.id} className="px-6 py-4 font-semibold group relative" 
                            style={{ width: header.getSize()}}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              
                                <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={`absolute right-0 top-0 h-full w-1 bg-blue-500 cursor-col-resize user-select-none touch-none opacity-0 group-hover:opacity-100 transition-opacity ${
                                header.column.getIsResizing() ? "bg-blue-600 opacity-100" : ""
                                }`}/>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                      {table.getRowModel().rows.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-zinc-500">
                            Tidak ada data ditemukan bro.
                          </td>
                        </tr>
                      ) : (
                        table.getRowModel().rows.map(row => (
                          <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id} className="px-4 py-3 align-middle">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-zinc-400">
                    Halaman <span className="font-medium text-slate-700 dark:text-zinc-300">{table.getState().pagination.pageIndex + 1}</span> dari <span className="font-medium text-slate-700 dark:text-zinc-300">{table.getPageCount()}</span>
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => table.previousPage()} 
                      disabled={!table.getCanPreviousPage()} 
                      className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors dark:text-zinc-300"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => table.nextPage()} 
                      disabled={!table.getCanNextPage()} 
                      className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors dark:text-zinc-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RECAP SIDEBAR */}
        {selectedRows.length > 0 && (
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm sticky top-6 h-fit max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-bold mb-4 border-b border-slate-100 dark:border-zinc-800 pb-3 text-slate-800 dark:text-zinc-100">
                  Terpilih: <span className="text-blue-600 dark:text-blue-500">{selectedRows.length}</span> Transaksi
                </h3>
                
                {/* Selected Items List */}
                <div className="flex flex-col gap-2 mb-5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedRows.map((d) => (
                    <div key={d.id} className="py-1">
                      <div className="font-bold text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-tight">
                        {d.transfer_info?.customer_name}
                      </div>
                      <div className="text-xs flex text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
                        <span>{d.transfer_info?.customer_bank_name}</span>
                      </div>
                      <div className="text-xs flex text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
                        <span><span>Uang: </span>{formatCurrency(d.amount)}</span>
                      </div>
                      <div className="text-xs flex text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
                        <span><span>Admin: </span>{formatCurrency(calculateAdminMargin(d.amount))}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="space-y-1 text-sm bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 mb-6">
                  <p className="flex justify-between items-center text-base">
                    <span className="font-bold text-slate-600 dark:text-zinc-400">TOTAL UANG:</span> 
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCurrency(totalNominal)}</span>
                  </p>
                  <p className="flex justify-between items-center text-base">
                    <span className="font-bold text-slate-600 dark:text-zinc-400">TOTAL ADMIN:</span> 
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCurrency(totalAdmin)}</span>
                  </p>
                  <p className="flex justify-between items-center text-base">
                    <span className="font-bold text-slate-600 dark:text-zinc-400">TOTAL SEMUA:</span> 
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCurrency(totalNominal + totalAdmin)}</span>
                  </p>
                </div>

                {/* ACTION BUTTONS */}
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
              </div>
          </div>
        )}
      </div>

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
                Ubah status untuk ID <span className="font-mono font-bold text-slate-900 dark:text-blue-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{editingTransaction.transfer_id}</span>?
                <br/>
                <span className="text-xs text-red-500 dark:text-red-400 mt-2 block font-medium">*Saldo akan otomatis disesuaikan.</span>
              </div>
              
              <select 
                value={newStatus} 
                onChange={e => setNewStatus(e.target.value as StatusBankEnum)} 
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
    </div>
  );
}