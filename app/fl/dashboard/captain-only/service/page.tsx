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
  Clock,
  CheckCircle2,
  XCircle,
  UserXIcon,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { getMasterDataServices } from '@/lib/services/service.services';
import { ServiceTransaction } from '@/config/type';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ─── BRANCH CONFIG ────────────────────────────────────────────────────────────
// Tambah cabang baru di sini aja, sisanya auto ngikut
const BRANCH_CONFIG: Record<string, { label: string; color: string; darkColor: string; prefix: string }> = {
  SKHT: { label: 'Sukahati',  color: 'bg-violet-100 text-violet-700 border-violet-200', darkColor: 'dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800', prefix: 'GPS-SKHT' },
  CKRT: { label: 'Cikaret',   color: 'bg-cyan-100 text-cyan-700 border-cyan-200',       darkColor: 'dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',       prefix: 'GPS-CKRT' },
};
/*
// May can used for future
const getBranchFromInvoice = (invoiceId: string): string => {
  const code = invoiceId?.split('GPS-')[1]?.substring(0, 4) ?? '';
  return BRANCH_CONFIG[code]?.label ?? 'Unknown';
};
*/
const getBranchCode = (invoiceId: string): string => {
  return invoiceId?.split('GPS-')[1]?.substring(0, 4) ?? '';
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  in_process: { label: 'Proses',      icon: Clock,         cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  picked_up:  { label: 'DiAmbil',     icon: CheckCircle2,  cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
  canceled:   { label: 'Batal',       icon: XCircle,       cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  completed:  { label: 'Selesai',     icon: CheckCircle2,  cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  lunas:      { label: 'Lunas',       icon: CheckCircle2,  cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.in_process;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${cfg.cls}`}>
      <Icon size={11} />{cfg.label}
    </span>
  );
};

const LocationBadge = ({ invoiceId }: { invoiceId: string }) => {
  const code = getBranchCode(invoiceId);
  const branch = BRANCH_CONFIG[code];
  if (!branch) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${branch.color} ${branch.darkColor}`}>
      <MapPin size={10} />{branch.label}
    </span>
  );
};

// ─── BRANCH STATS PANEL ───────────────────────────────────────────────────────
interface BranchStat {
  label: string;
  total: number;
  in_process: number;
  completed: number;
  canceled: number;
  revenue: number;
}

const BranchStatsCard = ({ stat, colorCls }: { stat: BranchStat; colorCls: string }) => (
  <div className={`relative overflow-hidden rounded-2xl border-2 p-4 ${colorCls}`}>
    <div className="flex items-center gap-2 mb-3">
      <MapPin size={15} />
      <span className="font-bold text-sm">{stat.label}</span>
      <span className="ml-auto text-xs opacity-70">{stat.total} total</span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-xl bg-black/5 dark:bg-white/5 p-2">
        <p className="text-lg font-black text-blue-600 dark:text-blue-400">{stat.in_process}</p>
        <p className="text-[10px] opacity-60 font-medium">Proses</p>
      </div>
      <div className="rounded-xl bg-black/5 dark:bg-white/5 p-2">
        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stat.completed}</p>
        <p className="text-[10px] opacity-60 font-medium">Selesai</p>
      </div>
      <div className="rounded-xl bg-black/5 dark:bg-white/5 p-2">
        <p className="text-lg font-black text-red-500">{stat.canceled}</p>
        <p className="text-[10px] opacity-60 font-medium">Batal</p>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
      <p className="text-xs opacity-60 mb-0.5">Total Revenue</p>
      <p className="font-bold text-sm">Rp {stat.revenue.toLocaleString('id-ID')}</p>
    </div>
  </div>
);

// ─── EXPANDED ROW CONTENT ─────────────────────────────────────────────────────
const ExpandedRowContent = ({ row }: { row: ServiceTransaction }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    className="p-3 border-t bg-slate-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-5xl">
      {/* Customer */}
      <div className="p-3 rounded-xl border bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><User size={11}/>Detail Pelanggan</h4>
        <InfoRow label="Nama"      value={row.customer_id} />
        <InfoRow label="Invoice"   value={row.invoice_id} />
        <InfoRow label="Penerima"  value={row.recipient_name} />
        <InfoRow label="Cabang"    value={row.location?.toUpperCase()} />
      </div>
      {/* Device */}
      <div className="p-3 rounded-xl border bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><Phone size={11}/>Detail Device</h4>
        <InfoRow label="Brand" value={row.phone_brand} />
        {row.phone_imei && <InfoRow label="IMEI" value={row.phone_imei} mono />}
        <InfoRow label="Keluhan"      value={row.complaint} />
        <InfoRow label="Kondisi Fisik" value={row.phisical_condition || '-'} />
        {row.treatment && <InfoRow label="Perbaikan" value={row.treatment} />}
      </div>
      {/* Technician */}
      <div className="p-3 rounded-xl border bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><UserXIcon size={11}/>Teknisi &amp; Biaya</h4>
        <InfoRow label="Teknisi" value={row.technician} />
        {row.technicial_fee && <InfoRow label="Fee Teknisi" value={`Rp ${row.technicial_fee.toLocaleString('id-ID')}`} />}
        <InfoRow label="Est. Harga" value={`Rp ${row.initial_price.toLocaleString('id-ID')}`} />
        <InfoRow label="Harga Akhir" value={`Rp ${row.final_price ? row.final_price.toLocaleString('id-ID') : 0}`} highlight />
      </div>
      {/* Timeline */}
      <div className="p-3 rounded-xl border bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><Clock size={11}/>Timeline</h4>
        <InfoRow label="Masuk" value={new Date(row.entry_datetime).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })} />
        {row.pickedup_at && <InfoRow label="Diambil" value={new Date(row.pickedup_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })} />}
        <div className="mt-2"><StatusBadge status={row.status} /></div>
      </div>
      {/* Spareparts */}
      {row.spareparts && row.spareparts.length > 0 && (
        <div className="p-3 rounded-xl border bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 sm:col-span-2">
          <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><Package size={11}/>Sparepart</h4>
          <div className="flex flex-wrap gap-2">
            {row.spareparts.map((part) => (
              <div key={part.id} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 text-xs">
                <p className="font-semibold text-gray-900 dark:text-white">{part.sparepart_name}</p>
                <p className="text-orange-600 dark:text-orange-400 font-bold">Rp {part.sparepart_price.toLocaleString('id-ID')}</p>
                {part.sparepart_warranty && <p className="text-gray-500">Garansi: {part.sparepart_warranty}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

const InfoRow = ({ label, value, mono, highlight }: { label: string; value?: string | null; mono?: boolean; highlight?: boolean }) => (
  <div className="flex items-start text-xs mb-1">
    <span className="text-gray-400 w-24 flex-shrink-0">{label}</span>
    <span className={`flex-1 ${mono ? 'font-mono' : 'font-medium'} ${highlight ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-gray-900 dark:text-white'}`}>
      : {value ?? '-'}
    </span>
  </div>
);

// ─── MOBILE CARD ──────────────────────────────────────────────────────────────
const MobileCardView = ({ row, router, isDark }: { row: ServiceTransaction; router: ReturnType<typeof useRouter>; isDark: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div layout className={`rounded-xl border overflow-hidden mb-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => router.push(`/fl/dashboard/service/update/${encodeURIComponent(row.invoice_id.trim())}`)}
            className="font-mono font-bold text-orange-600 dark:text-orange-400 hover:underline text-xs">
            {row.invoice_id}
          </button>
          <StatusBadge status={row.status} />
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{row.customers_info?.customer_name}</p>
        <div className={`grid grid-cols-2 gap-2 text-xs mb-2 p-2 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
          <div><span className="text-gray-500">Tanggal</span>
            <p className="font-medium mt-0.5">{new Date(row.entry_datetime).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}</p>
          </div>
          <div><span className="text-gray-500">Lokasi</span>
            <p className="mt-0.5"><LocationBadge invoiceId={row.invoice_id} /></p>
          </div>
          <div><span className="text-gray-500">Brand</span><p className="font-medium mt-0.5">{row.phone_brand}</p></div>
          <div><span className="text-gray-500">Total</span>
            <p className="font-bold text-orange-600 dark:text-orange-400 mt-0.5">Rp {row.final_price ? row.final_price.toLocaleString('id-ID') : 0}</p>
          </div>
        </div>
        <div className={`p-2 rounded-lg text-xs ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
          <span className="text-gray-500 block mb-1">Keluhan:</span>
          <p className="text-gray-900 dark:text-white line-clamp-2">{row.complaint}</p>
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className={`w-full mt-2 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
          {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
          {expanded ? 'Tutup' : 'Detail'}
        </button>
      </div>
      <AnimatePresence>{expanded && <ExpandedRowContent row={row} />}</AnimatePresence>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ServiceTableList = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  const [globalStats, setGlobalStats] = useState({ total: 0, completed: 0, in_process: 0, canceled: 0 });
  const [branchStats, setBranchStats] = useState<Record<string, BranchStat>>({});
  const [data, setData] = useState<ServiceTransaction[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0, totalRecords: 0, limit: 30, hasNextPage: false, hasPrevPage: false });
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async (page: number) => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      // Global counts
      const fetchCount = async (statusFilter?: string) => {
        let q = supabase.schema('glory').from('services_transactions').select('status', { count: 'exact', head: true });
        if (statusFilter) q = q.eq('status', statusFilter);
        const { count } = await q;
        return count || 0;
      };

      // Per-branch counts dari semua data (tidak terpengaruh filter halaman)
      const fetchBranchStats = async () => {
        const stats: Record<string, BranchStat> = {};
        for (const [code, cfg] of Object.entries(BRANCH_CONFIG)) {
          const likePattern = `GPS-${code}%`;
          const countQ = (status?: string) => {
            let q = supabase.schema('glory').from('services_transactions')
              .select('status', { count: 'exact', head: true })
              .like('invoice_id', likePattern);
            if (status) q = q.eq('status', status);
            return q;
          };
          const revenueQ = supabase.schema('glory').from('services_transactions')
            .select('final_price')
            .like('invoice_id', likePattern)
            .in('status', ['completed', 'picked_up', 'lunas']);

          const [{ count: total }, { count: inProcess }, { count: completed }, { count: canceled }, { data: revenueData }] = await Promise.all([
            countQ(), countQ('in_process'), countQ('completed'), countQ('canceled'), revenueQ,
          ]);
          stats[code] = {
            label: cfg.label,
            total: total || 0,
            in_process: inProcess || 0,
            completed: completed || 0,
            canceled: canceled || 0,
            revenue: (revenueData || []).reduce((sum: number, r: { final_price: number | null }) => sum + (r.final_price || 0), 0),
          };
        }
        return stats;
      };

      const [total, completed, inProcess, canceled, bStats] = await Promise.all([
        fetchCount(), fetchCount('completed'), fetchCount('in_process'), fetchCount('canceled'), fetchBranchStats(),
      ]);

      setGlobalStats({ total, completed, in_process: inProcess, canceled });
      setBranchStats(bStats);

      const result = await getMasterDataServices({
        page,
        limit: 30,
        search: debouncedSearch || undefined,
        month: selectedMonth !== 'all' ? parseInt(selectedMonth) : undefined,
        year: selectedYear !== 'all' ? parseInt(selectedYear) : undefined,
        // eslint-disable-next-line
        status: selectedStatus !== 'all' ? selectedStatus as any : undefined,
        // ✅ Branch filter sekarang server-side — pagination jadi akurat
        branch: selectedBranch !== 'all' ? selectedBranch : undefined,
      });

      setData(result.data || []);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedMonth, selectedYear, selectedStatus, selectedBranch]);

  React.useEffect(() => { fetchData(1); }, [fetchData]);

  const localStats = useMemo(() => ({
    completed_not_pick: data.filter(d => d.status === 'completed' && d.pickedup_at === null).length,
    canceled_not_pick:  data.filter(d => d.status === 'canceled'  && d.pickedup_at === null).length,
  }), [data]);

  // ── COLUMNS ── Compact untuk Z Fold 5 unfold (~884px), semua muat 1 baris
  const columns = useMemo<ColumnDef<ServiceTransaction>[]>(() => [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => row.getCanExpand() ? (
        <button onClick={row.getToggleExpandedHandler()} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          {row.getIsExpanded() ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
        </button>
      ) : null,
      size: 40,
    },
    {
      accessorKey: 'entry_datetime',
      header: ({ column }) => (
        <SortHeader label="Tanggal" column={column} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs whitespace-nowrap text-gray-700 dark:text-gray-300">
          {new Date(getValue() as string).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'2-digit' })}
        </span>
      ),
    },
    {
      accessorKey: 'invoice_id',
      header: 'Lokasi',
      cell: ({ getValue }) => <LocationBadge invoiceId={getValue() as string} />,
    },
    {
      accessorKey: 'phone_brand',
      header: 'HP',
      cell: ({ getValue }) => (
        <span className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">{(getValue() as string).length > 10 ? (getValue() as string).substring(0, 10) + '...' : getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'treatment',
      header: 'Perbaikan',
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400 block max-w-[160px] truncate" title={val ?? ''}>
            {val || <span className="text-gray-300 dark:text-gray-600">—</span>}
          </span>
        );
      },
    },
    {
      accessorKey: 'final_price',
      header: ({ column }) => <SortHeader label="Total" column={column} />,
      cell: ({ getValue }) => (
        <span className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
          {(getValue() as number) ? `Rp ${(getValue() as number).toLocaleString('id-ID')}` : 'Rp 0'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { expanded, sorting },
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
    setSearchInput(''); setDebouncedSearch('');
    setSelectedMonth('all'); setSelectedYear('all');
    setSelectedStatus('all'); setSelectedBranch('all');
    setSorting([]); setExpanded({});
  }, []);

  const selectCls = `px-3 py-2.5 text-sm rounded-xl border-2 outline-none transition-all ${isDark ? 'bg-gray-900 border-gray-700 text-white focus:border-orange-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500'}`;

  return (
    <div className={`min-h-screen p-4 md:p-6 lg:p-8 transition-colors duration-300 ${isDark ? 'bg-black border-2 border-gray-700 rounded-xl' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-[1600px] mx-auto">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className={`text-2xl md:text-3xl lg:text-4xl ${isDark ? 'text-white' : 'font-black text-gray-900'} mb-1`}>
              Service Transactions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Kelola dan monitor semua transaksi servis</p>
          </div>
        </div>

        {/* ── GLOBAL + PER-BRANCH STATS ── */}
        <div className={`p-4 md:p-5 rounded-2xl border-2 mb-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Global Row */}
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-orange-500" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rekap Semua Cabang</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
            <StatPill label="Total DB"         value={globalStats.total}      color="text-gray-900 dark:text-gray-100" />
            <StatPill label="Proses"           value={globalStats.in_process} color="text-blue-600 dark:text-blue-400" />
            <StatPill label="Selesai"          value={globalStats.completed}  color="text-emerald-600 dark:text-emerald-400" />
            <StatPill label="Batal"            value={globalStats.canceled}   color="text-red-500" />
            <StatPill label="Selesai, Blm Ambil" value={localStats.completed_not_pick} color="text-amber-600 dark:text-amber-400" />
            <StatPill label="Batal, Blm Ambil"   value={localStats.canceled_not_pick}  color="text-orange-600 dark:text-orange-400" />
          </div>

          {/* Per-Branch Cards */}
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={15} className="text-orange-500" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rincian Per Cabang</h2>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${Object.keys(BRANCH_CONFIG).length > 2 ? 'lg:grid-cols-3' : ''}`}>
            {Object.entries(BRANCH_CONFIG).map(([code, cfg]) => {
              const stat = branchStats[code] ?? { label: cfg.label, total: 0, in_process: 0, completed: 0, canceled: 0, revenue: 0 };
              const colorMap: Record<string, string> = {
                SKHT: `border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-900 dark:text-violet-100`,
                CKRT: `border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-100`,
              };
              return (
                <BranchStatsCard
                  key={code}
                  stat={stat}
                  colorCls={colorMap[code] ?? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100'}
                />
              );
            })}
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div className={`p-4 md:p-5 rounded-2xl border-2 mb-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input type="text" placeholder="Cari invoice, customer, brand..." value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border-2 outline-none transition-all ${isDark ? 'bg-gray-900 border-gray-700 text-white focus:border-orange-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500'}`}
              />
            </div>
            {/* Branch */}
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className={selectCls}>
              <option value="all">Semua Cabang</option>
              {Object.entries(BRANCH_CONFIG).map(([code, cfg]) => (
                <option key={code} value={code}>{cfg.label}</option>
              ))}
            </select>
            {/* Month */}
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={selectCls}>
              <option value="all">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>{new Date(2024, i, 1).toLocaleDateString('id-ID', { month:'long' })}</option>
              ))}
            </select>
            {/* Year */}
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={selectCls}>
              <option value="all">Semua Tahun</option>
              {['2024','2025','2026','2027'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {/* Status */}
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className={selectCls}>
              <option value="all">Semua Status</option>
              <option value="in_process">Proses</option>
              <option value="completed">Selesai</option>
              <option value="canceled">Dibatalkan</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleReset} disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''}/> Reset
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium">
              <Download size={13}/> Export
            </button>
          </div>
        </div>

        {/* ── MOBILE VIEW ── */}
        <div className="block sm:hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="animate-spin" size={28}/></div>
          ) : (
            <div>{data.map(row => <MobileCardView key={row.invoice_id} row={row} router={router} isDark={isDark}/>)}</div>
          )}
        </div>

        {/* ── TABLE (sm+, termasuk Z Fold 5 unfold ~884px) ── */}
        <div className={`hidden sm:block rounded-2xl border-2 overflow-hidden relative ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 dark:bg-white/10 flex items-center justify-center z-10 rounded-2xl">
              <RefreshCw className="animate-spin" size={28}/>
            </div>
          )}
          {/* Tabel compact: font kecil, padding tipis, kolom ga melebar berlebihan */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{width:'36px'}}/>
                <col style={{width:'90px'}}/>
                <col style={{width:'90px'}}/>
                <col style={{width:'100px'}}/>
                <col style={{minWidth:'120px'}}/>
                <col style={{width:'110px'}}/>
                <col style={{width:'90px'}}/>
              </colgroup>
              <thead className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id} className="px-2 py-3 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                <AnimatePresence>
                  {table.getRowModel().rows.map(row => (
                    <React.Fragment key={row.id}>
                      <tr
                        className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-orange-50/50'}`}
                        onClick={() => row.toggleExpanded()}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-2 py-2 text-gray-900 dark:text-white" onClick={e => e.stopPropagation()}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr key={`${row.id}-exp`}>
                          <td colSpan={columns.length} className="p-0">
                            <ExpandedRowContent row={row.original}/>
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

        {/* ── PAGINATION ── */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 mt-0 rounded-b-2xl border-2 border-t-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <span className="text-xs text-gray-500">
            Hal {pagination.currentPage} / {pagination.totalPages} &nbsp;·&nbsp; {pagination.totalRecords} total
          </span>
          <div className="flex items-center gap-1">
            {[
              { label: '««', page: 1, disabled: !pagination.hasPrevPage },
              { label: '‹',  page: pagination.currentPage - 1, disabled: !pagination.hasPrevPage },
              { label: '›',  page: pagination.currentPage + 1, disabled: !pagination.hasNextPage },
              { label: '»»', page: pagination.totalPages,      disabled: !pagination.hasNextPage },
            ].map(btn => (
              <button key={btn.label} onClick={() => fetchData(btn.page)} disabled={btn.disabled || isLoading}
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors">
                {btn.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SortHeader = ({ label, column }: { label: string; column: any }) => (
  <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    className="flex items-center gap-1 font-semibold hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-xs uppercase tracking-wider whitespace-nowrap">
    {label}
    {column.getIsSorted() === 'asc' ? <ArrowUp size={12}/> : column.getIsSorted() === 'desc' ? <ArrowDown size={12}/> : <ArrowUpDown size={12} className="opacity-40"/>}
  </button>
);

const StatPill = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 px-3 py-2.5">
    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 font-medium">{label}</p>
    <p className={`text-xl font-black ${color}`}>{value}</p>
  </div>
);

export default ServiceTableList;