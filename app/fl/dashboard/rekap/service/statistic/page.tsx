'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Search, RefreshCcw, Loader2, Wallet, Users,
    Calendar, Coins, ChevronDown, ChevronUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import React from 'react'

// 1. Tipe data dari VIEW
interface MonthlyStat {
    owner_id: string
    recipient_name: string
    point: number
    start_datetime: string
    end_datetime: string
}

// Tipe data buat Grouping per Orang
interface GroupedStat {
    owner_id: string
    recipient_name: string
    total_point: number
    months: MonthlyStat[]
}

export default function PointControl() {
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [stats, setStats] = useState<MonthlyStat[]>([])

    // State buat nyimpen UUID mana aja yang lagi di-expand (buka dropdown)
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const fetchPointData = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .schema('glory')
                .from('monthly_customer_points')
                .select('*')
                .order('start_datetime', { ascending: false })

            if (error) throw error
            setStats(data || [])
        } catch (error) {
            console.error('Error fetching view:', error)
            alert('Gagal narik data view bos!')
        } finally {
            setLoading(false)
            setIsSyncing(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchPointData()
    }, [fetchPointData])

    // 2. Logic Grouping Data per UUID/Nama
    const groupedData = useMemo(() => {
        const grouped = stats.reduce((acc: Record<string, GroupedStat>, curr) => {
            if (!acc[curr.owner_id]) {
                acc[curr.owner_id] = {
                    owner_id: curr.owner_id,
                    recipient_name: curr.recipient_name,
                    total_point: 0,
                    months: []
                }
            }
            acc[curr.owner_id].total_point += curr.point
            acc[curr.owner_id].months.push(curr)
            return acc
        }, {})

        // Ubah object jadi array & filter berdasarkan pencarian, lalu urutin dari poin tertinggi
        return Object.values(grouped)
            .filter(user => user.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b.total_point - a.total_point)
    }, [stats, searchTerm])

    // 3. Kalkulasi Profit Sharing Global
    const totalAllPoints = groupedData.reduce((acc, curr) => acc + curr.total_point, 0)
    const totalManagementPool = totalAllPoints * 0.20 // 20% ditarik
    const rrafShare = totalManagementPool * 0.35      // 35% dari pool
    const aldiShare = totalManagementPool * 0.65      // 65% dari pool

    // Fungsi buat buka/tutup dropdown baris
    const toggleRow = (ownerId: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(ownerId)) {
            newExpanded.delete(ownerId)
        } else {
            newExpanded.add(ownerId)
        }
        setExpandedRows(newExpanded)
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-4 md:p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 md:space-y-8">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Statistik & Revenue</h1>
                            <p className="text-xs md:text-sm text-gray-500">Monitoring Rekap Poin Frontliner</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setIsSyncing(true); fetchPointData(); }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 text-gray-800 dark:text-gray-200 w-full md:w-auto"
                    >
                        <RefreshCcw className={`h-4 w-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Data
                    </button>
                </div>

                {/* --- SUMMARY SECTION --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 sm:p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2 opacity-90">
                            <Wallet className="h-5 w-5 shrink-0" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider">Total Omzet Poin</h3>
                        </div>
                        <div className="text-3xl md:text-4xl font-bold font-mono tracking-tight mt-2 truncate">
                            {totalAllPoints.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                            <Users className="h-5 w-5 text-gray-700 dark:text-gray-300 shrink-0" />
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Alokasi Manajemen (20%)</h3>
                            <span className="sm:ml-auto text-xs sm:text-sm font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                                Pool: {totalManagementPool.toLocaleString('id-ID')} pts
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:gap-8">
                            <div className="space-y-1 min-w-0">
                                <label className="text-xs font-bold text-gray-500 uppercase">Jatah Rafi (35%)</label>
                                <div className="flex items-center text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-mono truncate">
                                    <Coins className="h-4 w-4 inline mr-1 shrink-0" />
                                    <span className="truncate">{rrafShare.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                            <div className="space-y-1 border-l border-gray-100 dark:border-gray-800 pl-4 sm:pl-8 min-w-0">
                                <label className="text-xs font-bold text-gray-500 uppercase">Jatah Aldi (65%)</label>
                                <div className="flex items-center text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-mono truncate">
                                    <Coins className="h-4 w-4 inline mr-1 shrink-0" />
                                    <span className="truncate">{aldiShare.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FILTER --- */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text" placeholder="Cari nama karyawan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        />
                    </div>
                </div>

                {/* --- REKAP KARYAWAN --- */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">

                    {/* DESKTOP: TABEL AKORDION (md ke atas) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Karyawan</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-center">Total Histori Bulan</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Total Akumulasi Poin</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Potong Pool (20%)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Hak Karyawan (80%)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-center">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {groupedData.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Kosong ngab 🏜️</td></tr>
                                ) : (
                                    groupedData.map((user) => {
                                        const total = user.total_point
                                        const mgmtPool = total * 0.20
                                        const takeHome = total * 0.80
                                        const isExpanded = expandedRows.has(user.owner_id)

                                        return (
                                            <React.Fragment key={user.owner_id}>
                                                {/* BARIS UTAMA (REKAP PER ORANG) */}
                                                <tr
                                                    onClick={() => toggleRow(user.owner_id)}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900 dark:text-gray-100">{user.recipient_name}</div>
                                                        <div className="text-xs text-gray-400">{user.owner_id.substring(0, 8)}...</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2.5 py-1 rounded-full font-medium">
                                                            {user.months.length} Bulan
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900 dark:text-white">
                                                        {total.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-red-500 dark:text-red-400 text-sm">
                                                        - {mgmtPool.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-green-600 dark:text-green-400">
                                                        <Coins className="h-4 w-4 inline mr-1" /> {takeHome.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button className="text-gray-400 group-hover:text-blue-500 transition-colors" aria-label="Lihat rincian">
                                                            {isExpanded ? <ChevronUp className="h-5 w-5 mx-auto" /> : <ChevronDown className="h-5 w-5 mx-auto" />}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* BARIS DROPDOWN (RINCIAN PER BULAN) */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={6} className="p-0 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                                                            <div className="px-6 py-4 bg-blue-50/30 dark:bg-blue-900/10 shadow-inner">
                                                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase flex items-center gap-2">
                                                                    <Calendar className="h-3 w-3" /> Rincian Bulan
                                                                </h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                    {user.months.map((m, i) => (
                                                                        <MonthCard key={i} m={m} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE: LIST AKORDION (di bawah md) */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                        {groupedData.length === 0 ? (
                            <div className="px-4 py-10 text-center text-gray-500 text-sm">Kosong ngab 🏜️</div>
                        ) : (
                            groupedData.map((user) => {
                                const total = user.total_point
                                const mgmtPool = total * 0.20
                                const takeHome = total * 0.80
                                const isExpanded = expandedRows.has(user.owner_id)

                                return (
                                    <div key={user.owner_id}>
                                        <button
                                            onClick={() => toggleRow(user.owner_id)}
                                            className="w-full text-left px-4 py-4 active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="font-bold text-gray-900 dark:text-gray-100 truncate">{user.recipient_name}</div>
                                                    <div className="text-xs text-gray-400 mb-1.5">{user.owner_id.substring(0, 8)}...</div>
                                                    <span className="inline-block bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2.5 py-1 rounded-full font-medium">
                                                        {user.months.length} Bulan
                                                    </span>
                                                </div>
                                                <ChevronDown
                                                    className={`h-5 w-5 text-gray-400 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 mt-3.5 text-center">
                                                <div className="bg-gray-50 dark:bg-gray-950 rounded-lg py-2 px-1">
                                                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wide">Total Poin</div>
                                                    <div className="font-mono font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                        {total.toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-950 rounded-lg py-2 px-1">
                                                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wide">Pool 20%</div>
                                                    <div className="font-mono font-semibold text-sm text-red-500 dark:text-red-400 truncate">
                                                        -{mgmtPool.toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-950 rounded-lg py-2 px-1">
                                                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wide">Hak 80%</div>
                                                    <div className="font-mono font-semibold text-sm text-green-600 dark:text-green-400 truncate">
                                                        {takeHome.toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 bg-blue-50/30 dark:bg-blue-900/10">
                                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase flex items-center gap-2 pt-1">
                                                    <Calendar className="h-3 w-3" /> Rincian Bulan
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {user.months.map((m, i) => (
                                                        <MonthCard key={i} m={m} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

// Kartu rincian per bulan — dipakai di versi tabel (desktop) & list (mobile)
function MonthCard({ m }: { m: MonthlyStat }) {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all">

            {/* --- Header: Tanggal/Bulan --- */}
            <div className="flex items-center justify-center border-b border-gray-100 dark:border-gray-700 pb-2 mb-3">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {new Date(m.start_datetime).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
            </div>

            {/* --- Body: Poin & Unit (Dibelah dua) --- */}
            <div className="flex justify-between items-center w-full px-2">

                {/* Sisi Kiri: Total Poin */}
                <div className="flex flex-col items-start min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Total Poin
                    </span>
                    <span className="text-base font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                        {m.point.toLocaleString('id-ID')}
                    </span>
                </div>

                {/* Garis Pemisah (Divider) di Tengah */}
                <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 shrink-0 mx-2"></div>

                {/* Sisi Kanan: Total Unit */}
                <div className="flex flex-col items-end min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Service
                    </span>
                    <span className="text-base font-mono font-bold text-green-600 dark:text-green-400 mt-0.5 truncate">
                        {m.point / 5000} Unit
                    </span>
                </div>

            </div>
        </div>
    )
}