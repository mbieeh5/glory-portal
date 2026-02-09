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
      label: 'Sudah DiAmbil',
      icon: CheckCircle2,
      className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    },
    canceled: {
      label: 'cancel',
      icon: XCircle,
      className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    },
    completed: {
      label: 'selesai',
      icon: CheckCircle2,
      className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
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

// --- EXPANDED ROW CONTENT - REDESIGNED ---   
const ExpandedRowContent = ({ row }: { row: ServiceTransaction }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`p-3 border-t ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-slate-50 border-gray-200'}`}
    >
      {/* Single Column Layout - Clean & Simple */}
      <div className="space-y-3 max-w-4xl">
        {/* Customer Info Section */}
        <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <User size={12} /> Detail Pelanggan
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start">
              <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Nama</span>
              <span className="font-medium text-gray-900 dark:text-white">: {row.customer_id}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Penerima</span>
              <span className="font-medium text-gray-900 dark:text-white">: {row.recipient_name}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Cabang</span>
              <span className="font-medium text-gray-900 dark:text-white">: {row.location.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Device Info Section */}
        <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <Phone size={12} /> Detail Device
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start">
              <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Brand</span>
              <span className="font-medium text-gray-900 dark:text-white">: {row.phone_brand}</span>
            </div>
            {row.phone_imei && (
              <div className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">IMEI</span>
                <span className="font-mono text-gray-900 dark:text-white">: {row.phone_imei}</span>
              </div>
            )}
          </div>
        </div>

        {/* Complaint & Treatment Section */}
        <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <Wrench size={12} /> Kondisi & Perbaikan
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-start">
              <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Keluhan</span>
              <span className="text-gray-900 dark:text-white flex-1">: {row.complaint}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Kondisi Fisik</span>
              <span className="text-gray-900 dark:text-white flex-1">: {row.phisical_condition || '-'}</span>
            </div>
            {row.treatment && (
              <div className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Perbaikan</span>
                <span className="text-gray-900 dark:text-white flex-1">: {row.treatment}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Info Section */}
        <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <CreditCard size={12} /> Detail Biaya
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start">
              <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Estimasi Awal</span>
              <span className="font-medium text-gray-900 dark:text-white">: Rp {row.initial_price.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Harga Final</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">: Rp {row.final_price ? row.final_price.toLocaleString('id-ID') : 0}</span>
            </div>
            {row.technicial_fee && (
              <div className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Fee Teknisi</span>
                <span className="font-medium text-gray-900 dark:text-white">: Rp {row.technicial_fee.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Section */}
        <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <Clock size={12} /> Timeline
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start">
              <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Masuk</span>
              <span className="font-medium text-gray-900 dark:text-white">
                : {new Date(row.entry_datetime).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {row.pickedup_at && (
              <div className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Diambil</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  : {new Date(row.pickedup_at).toLocaleDateString('id-ID', {
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

        {/* Spareparts Section */}
        {row.spareparts && row.spareparts.length > 0 && (
          <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Package size={12} /> Sparepart Digunakan
            </h4>
            <div className="space-y-2">
              {row.spareparts.map((part) => (
                <div
                  key={part.id}
                  className={`p-2 rounded-lg border ${isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start">
                      <span className="text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Nama</span>
                      <span className="font-medium text-gray-900 dark:text-white flex-1">: {part.sparepart_name}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Harga</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">: Rp {part.sparepart_price.toLocaleString('id-ID')}</span>
                    </div>
                    {part.sparepart_warranty && (
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Garansi</span>
                        <span className="text-gray-900 dark:text-white">: {part.sparepart_warranty}</span>
                      </div>
                    )}
                    {part.sparepart_variant && (
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Warna</span>
                        <span className="text-gray-900 dark:text-white">: {part.sparepart_variant}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- MOBILE CARD VIEW ---
const MobileCardView = ({ 
  row, 
  router, 
  isDark 
}: { 
  row: ServiceTransaction; 
  router: ReturnType<typeof useRouter>; 
  isDark: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`rounded-xl border overflow-hidden mb-3 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* Card Header - Compact */}
      <div className="p-3">
        {/* Top Row - Invoice & Status */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push(`/fl/dashboard/service/update/${encodeURIComponent(row.invoice_id.trim())}`)}
            className="font-mono font-bold text-orange-600 dark:text-orange-400 hover:underline text-xs"
          >
            {row.invoice_id}
          </button>
          <StatusBadge status={row.status} />
        </div>

        {/* Customer Name */}
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {row.customers_info?.customer_name}
        </p>

        {/* Compact Info Grid */}
        <div className={`grid grid-cols-2 gap-2 text-xs mb-2 p-2 rounded-lg ${
          isDark ? 'bg-gray-700/30' : 'bg-gray-50'
        }`}>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tanggal</span>
            <p className="font-medium text-gray-900 dark:text-white mt-0.5">
              {new Date(row.entry_datetime).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Brand</span>
            <p className="font-medium text-gray-900 dark:text-white mt-0.5">
              {row.phone_brand}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Penerima</span>
            <p className="font-medium text-gray-900 dark:text-white mt-0.5">
              {row.recipient_name}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total</span>
            <p className="font-bold text-orange-600 dark:text-orange-400 mt-0.5">
              Rp {row.final_price ? row.final_price.toLocaleString('id-ID') : 0}
            </p>
          </div>
        </div>

        {/* Complaint - Compact */}
        <div className={`p-2 rounded-lg text-xs ${
          isDark ? 'bg-gray-700/50' : 'bg-gray-100'
        }`}>
          <span className="text-gray-500 dark:text-gray-400 block mb-1">Keluhan:</span>
          <p className="text-gray-900 dark:text-white line-clamp-2 leading-relaxed">
            {row.complaint}
          </p>
        </div>

        {/* Expand Button - Compact */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full mt-2 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
            isDark
              ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
              : 'border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {isExpanded ? 'Tutup' : 'Detail'}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && <ExpandedRowContent row={row} />}
      </AnimatePresence>
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
    }, 500);

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
    fetchData(1);
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
          <span className="text-sm whitespace-nowrap">
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
              className="font-mono font-semibold text-orange-600 dark:text-orange-400 hover:underline hover:text-orange-700 transition-all text-left whitespace-nowrap"
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
        header: 'Kondisi',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate block">
            {getValue() as string}
          </span>
        ),
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
          <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
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
    [router]
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

  const handlePageChange = (newPage: number) => {
    fetchData(newPage);
  };

  const stats = useMemo(() => ({
    completed: data.filter((d) => d.status === 'completed' && d.pickedup_at?.length ? d.pickedup_at?.length > 0 : false).length,
    inProcess: data.filter((d) => d.status === 'in_process').length,
    canceled: data.filter((d) => d.status === 'canceled' && d.pickedup_at?.length ? d.pickedup_at?.length > 0 : false).length,
    completed_not_pick: data.filter((d) => d.status === 'completed' && d.pickedup_at === null).length,
    canceled_not_pick: data.filter((d) => d.status === 'canceled' && d.pickedup_at === null).length,
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className={`text-2xl md:text-3xl lg:text-4xl ${isDark ? 'text-white' : 'font-black text-gray-900'} mb-2`}>
              Service Transactions
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Kelola dan monitor semua transaksi servis
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div
          className={`p-4 md:p-6 rounded-2xl border-2 mb-4 md:mb-6 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className={`absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
              <input
                type="text"
                placeholder="Cari invoice, customer, brand..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base rounded-xl border-2 outline-none transition-all ${
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
              className={`px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-xl border-2 outline-none transition-all ${
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
              className={`px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-xl border-2 outline-none transition-all ${
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
              className={`px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-xl border-2 outline-none transition-all ${
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
          <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg 
                ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}
                transition-colors text-xs md:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Reset Filter
            </button>
            <button className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors text-xs md:text-sm font-medium">
              <Download size={14} /> Export Data
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Database</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-400">{pagination.totalRecords}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selesai</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completed}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Proses</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.inProcess}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Batal</p>
              <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-600">
                {stats.canceled}
              </p>
            </div>
          </div>
        </div>

        {/* MOBILE VIEW - Card Layout (Only small phones) */}
        <div className="block sm:hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((row) => (
                <MobileCardView key={row.invoice_id} row={row} router={router} isDark={isDark} />
              ))}
            </div>
          )}
        </div>

        {/* TABLET & DESKTOP VIEW - Table Layout (sm and up, includes Fold devices) */}
        <div
          className={`hidden sm:block rounded-2xl border-2 overflow-hidden relative ${
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
                        className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
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
                          <td key={cell.id} className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-900 dark:text-white">
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
        </div>

        {/* Pagination - Responsive */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 p-4 md:p-6 mt-4 sm:mt-0 rounded-2xl border-2 sm:rounded-t-none ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Halaman {pagination.currentPage} dari {pagination.totalPages} 
            {' '}({pagination.totalRecords} total data)
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={!pagination.hasPrevPage || isLoading}
              className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {'<<'}
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
              className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {'<'}
            </button>
            <span className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium">
              {pagination.currentPage}/{pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {'>'}
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={!pagination.hasNextPage || isLoading}
              className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {'>>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTransactionsTable;