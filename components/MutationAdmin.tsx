"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
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
import { StatusBankEnum, BankTransaction, BankConfig } from "@/config/type";

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
    [StatusBankEnum.COMPLETED]: "bg-emerald-100 text-emerald-700 border-emerald-300",
    [StatusBankEnum.PENDING]: "bg-amber-100 text-amber-700 border-amber-300",
    [StatusBankEnum.FAILED]: "bg-slate-100 text-slate-700 border-slate-300",
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
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data: transactions, error } = await supabase
      .schema('glory')
        .from('bank_transactions')
        .select(`*, transfer_info: bank_customers (
            customer_name, 
            customer_bank_account, 
            customer_bank_name
            ),
            config_info: bank_config (
            bank_name
            )`)
            .or('transfer_id.ilike.%CKT%,transfer_id.ilike.%SKH%')
        .order('entry_datetime', { ascending: false });

      if (error) throw error;
      setData(transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Gagal load data!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    // REALTIME SUBSCRIPTION
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
  }, []);

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
            className="p-1 hover:bg-slate-200 rounded"
          >
            {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
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
            className="p-1 hover:bg-slate-200 rounded"
          >
            {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
          </button>
        );
      },
    },
    {
      accessorKey: "transfer_id",
      header: ({ column }) => (
        <button 
          className="flex items-center gap-2 hover:text-blue-600" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs font-bold">{(row.getValue("transfer_id")as string)?.split('-')[0] === 'CKT' ? "Cikaret" : "Sukahati"}</div>
          {row.original.is_check && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-bold">
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
          className="flex items-center gap-2 hover:text-blue-600" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Waktu <ArrowUpDown className="w-3 h-3"/>
        </button>
      ),
      cell: ({ row }) => <div className="text-xs">{formatDate(row.getValue("entry_datetime"))}</div>,
    },
    {
      accessorKey: "customer_name",
      header: "Pelanggan",
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-sm">{row.getValue("customer_name")}</div>
          <div className="text-xs text-slate-500 font-mono">
            <span>
            {row.original.transfer_info?.customer_bank_account}
            </span>
            <span>
            {row.original.transfer_info?.customer_bank_name}
            </span>
            <span>
            {row.original.transfer_info?.customer_name}
            </span>
          </div>

        </div>
      )
    },
    {
      accessorKey: "config_info",
      header: 'Sumber',
      cell: ({ row }) => <div className="text-xs font-medium">{(row.getValue("config_info") as unknown as BankConfig)?.bank_name}</div>,
    },
    {
        accessorKey: "balance_before",
        header: "Saldo Sebelum",
        size: 20,
        minSize: 20,
        maxSize: 25,
        cell: ({ row }) => (
            <div className="font-light font-mono text slate-800">
                {formatCurrency(row.getValue('balance_before'))}
            </div>
        ),
    },
    {
      accessorKey: "amount",
      header: "Nominal",
      cell: ({ row }) => (
        <div className="font-bold font-mono text-slate-800">
          {formatCurrency(row.getValue("amount"))}
        </div>
      ),
    },
    {
        accessorKey: "balance_after",
        header: "Saldo Sesudah",
        cell: ({ row }) => (
            <div className="font-light font-mono text-slate-800">
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
          className="p-1.5 hover:bg-slate-200 rounded text-slate-500"
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
    
    // Filter Lokasi
    if (locationFilter !== "all") {
      filtered = filtered.filter((t) => t.transfer_id.split('-')[0] === locationFilter);
    }
    
    // Filter Status
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    
    // Filter Tanggal
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
    
    // Search
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
            updateData = { status: StatusBankEnum.COMPLETED };
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
    
    // TODO: Implement cetak logic (bisa redirect ke halaman cetak atau generate PDF)
    console.log("Cetak IDs:", selectedIds);
    alert(`Cetak ${selectedIds.length} transaksi - Coming soon!`);
  };

  return (
    <div className="p-2 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* MAIN CONTENT */}
        <div className="flex-1">
          {/* HEADER & STATS */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start">
            <div>
              <h1 className="text-2xl font-light text-slate-800">Mutasi Transaksi</h1>
              <p className="text-slate-500 text-sm">Monitor semua aliran dana</p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="text-xs text-slate-500 uppercase font-bold">Cikaret (OUT)</div>
                <div className="text-lg font-mono font-bold text-purple-600">
                  {formatCurrency(stats.cikaret.total)}
                </div>
                <div className="text-xs text-slate-400">{stats.cikaret.count} Transaksi</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="text-xs text-slate-500 uppercase font-bold">Sukahati (OUT)</div>
                <div className="text-lg font-mono font-bold text-emerald-600">
                  {formatCurrency(stats.sukahati.total)}
                </div>
                <div className="text-xs text-slate-400">{stats.sukahati.count} Transaksi</div>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
            <div className="flex gap-3 flex-wrap items-end">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                <input 
                  value={globalFilter} 
                  onChange={e => setGlobalFilter(e.target.value)}
                  placeholder="Cari nama, rekening, ID..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Date Range */}
              <div className="flex gap-2 items-center">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border rounded text-sm"
                />
                <span className="text-slate-400">—</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border rounded text-sm"
                />
              </div>

              {/* Location Filter */}
              <select 
                value={locationFilter} 
                onChange={e => setLocationFilter(e.target.value)} 
                className="px-3 py-2 bg-slate-50 border rounded text-sm"
              >
                <option value="all">Semua Lokasi</option>
                <option value="CKT">Cikaret</option>
                <option value="SKH">Sukahati</option>
              </select>

              {/* Status Filter */}
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)} 
                className="px-3 py-2 bg-slate-50 border rounded text-sm"
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
                className="p-2 hover:bg-slate-100 border rounded text-slate-600 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading data...
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs"
                    >
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th key={header.id} className="px-6 py-3 font-semibold group" 
                            style={{ width: header.getSize()}}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              
                                <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={`absolute right-0 top-0 h-full w-1 bg-blue-500 cursor-col-resize user-select-none touch-none opacity-0 group-hover:opacity-100 ${
                                header.column.getIsResizing() ? "bg-blue-700 opacity-100" : ""
                                }`}/>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {table.getRowModel().rows.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                            Tidak ada data ditemukan.
                          </td>
                        </tr>
                      ) : (
                        table.getRowModel().rows.map(row => (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id} className="px-3 py-1">
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
                <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm text-slate-500">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => table.previousPage()} 
                      disabled={!table.getCanPreviousPage()} 
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-slate-50"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => table.nextPage()} 
                      disabled={!table.getCanNextPage()} 
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-slate-50"
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
          <div className="max-w-xl lg:w-80 flex-shrink-0 flex flex-col gap-4">
            <div className="bg-gray-50 border p-5 rounded-xl shadow-sm sticky top-6">
              <h3 className="text-lg font-bold mb-4 border-b pb-2">
                Terpilih: {selectedRows.length} Transaksi
              </h3>
              
              {/* Selected Items List */}
              <div className="flex flex-col gap-2 mb-4 max-h-60 overflow-y-auto pr-2">
                {selectedRows.map((d) => (
                  <div key={d.id} className="text-sm flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-medium truncate">{d.transfer_info?.customer_name}</span>
                    <span className="font-mono">{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="space-y-1 text-sm bg-white p-3 rounded-lg border mb-4">
                <p className="flex justify-between text-base">
                  <span className="font-bold">TOTAL:</span> 
                  <span className="font-bold text-blue-600">{formatCurrency(totalNominal)}</span>
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                <button 
                  onClick={() => handleBulkAction("LUNAS")} 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  TANDAI LUNAS
                </button>
                <button 
                  onClick={() => handleBulkAction("SUKSES")} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  TANDAI SUKSES
                </button>
                <button 
                  onClick={() => handleBulkAction("PENDING")} 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  TANDAI PENDING
                </button>
                <button 
                  onClick={handleCetak} 
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  CETAK KEMBALI
                </button>
                <button 
                  onClick={() => handleBulkAction("BATAL")} 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  BATALKAN
                </button>
                <button 
                  onClick={() => handleBulkAction("HAPUS")} 
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
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
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
            >
              <h3 className="text-lg font-bold mb-4">Edit Status</h3>
              <div className="mb-4 text-sm text-slate-600">
                Ubah status untuk <span className="font-mono font-bold text-slate-900">{editingTransaction.transfer_id}</span>?
                <br/>
                <span className="text-xs text-red-500 mt-1 block">*Saldo akan otomatis disesuaikan.</span>
              </div>
              
              <select 
                value={newStatus} 
                onChange={e => setNewStatus(e.target.value as StatusBankEnum)} 
                className="w-full p-2 border rounded mb-6"
              >
                <option value="completed">Selesai (Completed)</option>
                <option value="pending">Pending</option>
                <option value="canceled">Batal (Canceled)</option>
              </select>

              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingTransaction(null)} 
                  className="flex-1 py-2 border rounded hover:bg-slate-50"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isPending} 
                  className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
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