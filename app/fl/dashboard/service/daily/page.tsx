'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  ExpandedState,
  SortingState,
} from '@tanstack/react-table';
import { useTheme } from 'next-themes';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  Phone,
  User,
  Wrench,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { getMasterDataServices } from '@/lib/services/service.services';
import { ServiceTransaction } from '@/config/type';
import { useRouter } from 'next/navigation';

// --- STATUS BADGE ---
const StatusBadge = ({ status }: { status: string }) => {
  const configs = {
    in_process: {
      label: 'Dalam Proses',
      icon: Clock,
      className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    picked_up: {
      label: 'selesai',
      icon: CheckCircle2,
      className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    },
    canceled: {
      label: 'cancel',
      icon: XCircle,
      className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    },
    completed: {
      label: 'Menunggu Sparepart',
      icon: AlertCircle,
      className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    },
  };

  const config = configs[status as keyof typeof configs] || configs.in_process;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
};

// --- EXPANDED ROW CONTENT ---   
const ExpandedRowContent = ({ row }: { row: ServiceTransaction }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`p-6 border-t ${isDark ? 'bg-black border-gray-700' : 'bg-gray-50 border-gray-200'}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <User size={16} /> Detail Pelanggan
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Nama:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{row.customer_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Penerima:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{row.recipient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Cabang:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{row.location.toLocaleUpperCase()}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Phone size={16} /> Detail Device
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Brand:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{row.phone_brand}</span>
              </div>
              {row.phone_imei && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">IMEI:</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">{row.phone_imei}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Wrench size={16} /> Keluhan & Treatment
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Keluhan:</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{row.complaint}</p>
              </div>
              {row.treatment && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Treatment:</span>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{row.treatment}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <CreditCard size={16} /> Detail Biaya
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Harga Awal:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Rp {row.initial_price.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Harga Final:</span>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  Rp {row.final_price ? row.final_price.toLocaleString('id-ID'): 0}
                </span>
              </div>
              {row.technician_fee && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Fee Teknisi:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Rp {row.technician_fee.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Clock size={16} /> Timeline
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Masuk:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(row.entry_datetime).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {row.pickuped_datetime && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Diambil:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(row.pickuped_datetime).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Spareparts */}
          {
            row.spareparts && (
              <>
              {row.spareparts.length > 0 && (
                <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Package size={16} /> Sparepart Digunakan
                </h4>
                <div className="space-y-2">
                {row.spareparts.map((part) => (
                  <div
                    key={part.id}
                    className={`p-3 rounded-lg border ${
                      isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'
                      }`}
                      >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{part.sparepart_name}</span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        Rp {part.sparepart_price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                      {part.sparepart_warranty && <span>Garansi: {part.sparepart_warranty}</span>}
                      {part.sparepert_variant && <span>Warna: {part.sparepert_variant}</span>}
                    </div>
                  </div>
                ))}
                </div>
                </div>
              )}
            </>
            )
          }
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
const ServiceTransactionsTable = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  // Data & Pagination State dari Backend
  const [data, setData] = useState<ServiceTransaction[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    limit: 30,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // UI State
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // Server-side Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Debounce search input
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce effect untuk search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch data dari backend dengan filters
  const fetchData = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const result = await getMasterDataServices({ 
        page, 
        limit: 30,
        search: debouncedSearch || undefined,
        month: selectedMonth !== 'all' ? parseInt(selectedMonth) : undefined,
        year: selectedYear !== 'all' ? parseInt(selectedYear) : undefined,
        // eslint-disable-next-line
        status: selectedStatus !== 'all' ? selectedStatus as any : undefined,
      });
      setData(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedMonth, selectedYear, selectedStatus]);

  // Re-fetch when filters change
  React.useEffect(() => {
    fetchData(1); // Always reset to page 1 when filters change
  }, [fetchData]);

  // Columns
  const columns = useMemo<ColumnDef<ServiceTransaction>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          return row.getCanExpand() ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {row.getIsExpanded() ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : null;
        },
        size: 50,
      },
      {
        accessorKey: 'entry_datetime',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 font-semibold hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            Tanggal Masuk
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp size={14} />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={14} className="opacity-40" />
            )}
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm">
            {new Date(getValue() as string).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        accessorKey: 'invoice_id',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 font-semibold hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            Invoice ID
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp size={14} />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={14} className="opacity-40" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const invId = getValue() as string;
          return (
            <button
              onClick={() => router.push(`/fl/dashboard/service/update/${encodeURIComponent(invId.trim())}`)}
              className="font-mono font-semibold text-orange-600 dark:text-orange-400 hover:underline hover:text-orange-700 transition-all text-left"
            >
              {invId}
            </button>
          );
        },
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer',
        cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
      },
      {
        accessorKey: 'phone_brand',
        header: 'Merek HP',
      },
      {
        accessorKey: 'complaint',
        header: 'Keluhan',
        cell: ({ getValue }) => <span className="text-sm text-gray-600 dark:text-gray-400">{getValue() as string}</span>,
      },
      {
        accessorKey: 'technician',
        header: 'Teknisi',
      },
      {
        accessorKey: 'final_price',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 font-semibold hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            Total
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp size={14} />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={14} className="opacity-40" />
            )}
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="font-bold text-gray-900 dark:text-white">
            Rp {(getValue() as number) ? (getValue() as number).toLocaleString('id-ID') : 0}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
    ],
    []
  );

  const table = useReactTable({
    data: data,
    columns,
    state: {
      expanded,
      sorting,
    },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const handleReset = useCallback(() => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedStatus('all');
    setSorting([]);
    setExpanded({});
  }, []);

  // Handler untuk pagination buttons
  const handlePageChange = (newPage: number) => {
    fetchData(newPage);
  };

  // Client-side stats (dari data yang udah di-fetch)
  const stats = useMemo(() => ({
    completed: data.filter((d) => d.status === 'completed' && d.pickuped_datetime?.length ? d.pickuped_datetime?.length > 0 : false).length,
    inProcess: data.filter((d) => d.status === 'in_process').length,
    canceled: data.filter((d) => d.status === 'canceled' && d.pickuped_datetime?.length ? d.pickuped_datetime?.length > 0 : false).length,
    completed_not_pick: data.filter((d) => d.status === 'completed' && d.pickuped_datetime === null).length,
    canceled_not_pick: data.filter((d) => d.status === 'canceled' && d.pickuped_datetime === null).length,
  }), [data]);

  return (
    <div
      className={`min-h-screen p-4 md:p-6 lg:p-8 transition-colors duration-300 ${
        isDark
          ? 'bg-black border-2 border-gray-700 rounded-xl'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}
    >
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl md:text-4xl ${isDark ? 'text-white' : 'font-black text-gray-900'} mb-2`}>
              Service Transactions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola dan monitor semua transaksi servis
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div
          className={`p-6 rounded-2xl border-2 mb-6 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
              <input
                type="text"
                placeholder="Cari invoice, customer, brand, IMEI, teknisi, sparepart..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${
                  isDark
                    ? 'bg-gray-900 border-gray-700 text-white focus:border-orange-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500'
                }`}
              />
            </div>

            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white focus:border-orange-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500'
              }`}
            >
              <option value="all">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i, 1).toLocaleDateString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white focus:border-orange-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500'
              }`}
            >
              <option value="all">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white focus:border-orange-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500'
              }`}
            >
              <option value="all">Semua Status</option>
              <option value="in_process">Dalam Proses</option>
              <option value="completed">Selesai</option>
              <option value="canceled">Dibatalkan</option>
              <option value="completed_not_pick">Selesai Belum Di Ambil</option>
              <option value="canceled_not_pick">Batal Belum di Ambil</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg 
                ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}
                transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Reset Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors text-sm font-medium">
              <Download size={16} /> Export Data
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Database</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-400">{pagination.totalRecords}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selesai (halaman ini)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completed}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dalam Proses</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.inProcess}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Batal</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-600">
                {stats.canceled}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          className={`rounded-2xl border-2 overflow-hidden relative ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 dark:bg-white/10 flex items-center justify-center z-10 rounded-2xl">
              <RefreshCw className="animate-spin" size={32} />
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr
                        className={`transition-colors ${
                          isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr key={`${row.id}-expanded`}>
                          <td colSpan={columns.length} className="p-0">
                            <ExpandedRowContent row={row.original} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className={`flex flex-col md:flex-row items-center justify-between gap-4 p-6 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Halaman {pagination.currentPage} dari {pagination.totalPages} 
              {' '}({pagination.totalRecords} total data)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrevPage || isLoading}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {'<<'}
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage || isLoading}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {'<'}
              </button>
              <span className="px-4 py-2 text-sm font-medium">
                Halaman {pagination.currentPage} dari {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {'>'}
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNextPage || isLoading}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {'>>'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTransactionsTable;