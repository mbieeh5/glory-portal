'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
    ArrowLeft, Loader2, Calendar, Coins, CheckCircle2, AlertTriangle, 
    RefreshCcw, History, Wallet, FileText
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Type buat Pending (View)
interface MonthlyStat {
    start_datetime: string
    end_datetime: string
    point: number
}

interface GroupedMonth {
    periodKey: string
    start_datetime: string
    end_datetime: string
    total_point: number
}

interface PencairanLogDetails {
    owner_id: string;
    full_name: string;
    total_nota: number;
    point: number;
    take_home: number;
}

// Type buat Log Pencairan
interface PencairanLog {
    id: string
    start_date: string
    end_date: string
    total_nota: number
    total_point: number
    rraf_share: number
    aldi_share: number
    frontliner_share: number
    created_at: string
    details? : PencairanLogDetails[]
}

export default function PencairanPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    
    const [stats, setStats] = useState<MonthlyStat[]>([])
    const [logs, setLogs] = useState<PencairanLog[]>([])

    // Tarik 2 data sekaligus (Pending & History)
    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true)
            
            // 1. Tarik Data Pending (is_checked_point = false)
            const { data: pendingData, error: pendingErr } = await supabase
                .schema('glory')
                .from('monthly_customer_points')
                .select('start_datetime, end_datetime, point')
                
            if (pendingErr) throw pendingErr

            // 2. Tarik Data Riwayat Pencairan (Logs)
            const { data: logData, error: logErr } = await supabase
                .schema('glory')
                .from('pencairan_services_logs')
                .select('*')
                .order('created_at', { ascending: false })
                
            if (logErr) throw logErr

            setStats(pendingData || [])
            setLogs(logData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            alert('Gagal narik data pencairan. Cek console ngab.')
        } finally {
            setLoading(false)
            setIsSyncing(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    // Grouping per bulan buat yang pending
    const groupedByMonth = useMemo(() => {
        const grouped = stats.reduce((acc: Record<string, GroupedMonth>, curr) => {
            const key = curr.start_datetime 
            if (!acc[key]) {
                acc[key] = {
                    periodKey: key,
                    start_datetime: curr.start_datetime,
                    end_datetime: curr.end_datetime,
                    total_point: 0
                }
            }
            acc[key].total_point += curr.point
            return acc
        }, {})

        return Object.values(grouped).sort((a, b) => 
            new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()
        )
    }, [stats])

    // Fungsi Eksekusi
    const handleCairkan = async (month: GroupedMonth) => {
        const confirmText = `Yakin mau cairin bulan ${new Date(month.start_datetime).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}? \nTotal omzet: ${month.total_point.toLocaleString('id-ID')} pts`
        
        if (!confirm(confirmText)) return

        try {
            setIsSyncing(true)
            
            const { data: updatedRows, error } = await supabase
                .schema('glory')
                .rpc('cairkan_poin_bulanan', {
                    p_start_date: month.start_datetime,
                    p_end_date: month.end_datetime
                })

            if (error) throw error

            alert(`✅ Cair Bosku! Berhasil memproses ${updatedRows} nota.`)
            fetchAllData() // Refresh biar data pindah dari "Pending" ke "Riwayat"

        } catch (error) {
            console.error('Gagal cair:', error)
            alert('Aduh gagal cair bos, cek console yak.')
        } finally {
            setIsSyncing(false)
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* HEADER */}
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Wallet className="h-6 w-6 text-blue-600" /> Pencairan Poin
                            </h1>
                            <p className="text-sm text-gray-500">Eksekusi nota & histori bagi hasil</p>
                        </div>
                    </div>
                    <button onClick={() => { setIsSyncing(true); fetchAllData(); }} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-colors active:scale-95">
                        <RefreshCcw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* --- SECTION 1: MENUNGGU PENCAIRAN --- */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" /> Menunggu Eksekusi
                    </h2>
                    
                    <div className="space-y-4">
                        {groupedByMonth.length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                                <h3 className="text-md font-bold text-gray-900 dark:text-white">Semua Udah Cair!</h3>
                                <p className="text-gray-500 text-sm">Gak ada omzet pending yang nyangkut ngab.</p>
                            </div>
                        ) : (
                            groupedByMonth.map((month) => (
                                <div key={month.periodKey} className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                                    <div className="flex items-center gap-4 pl-2">
                                        <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                Bulan {new Date(month.start_datetime).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                            </h3>
                                            <p className="text-sm text-amber-600 dark:text-amber-500 font-medium">Pending pencairan</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 border-t md:border-t-0 border-gray-100 dark:border-gray-800 pt-4 md:pt-0">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Omzet</span>
                                            <span className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                                                {month.total_point.toLocaleString('id-ID')} pts
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleCairkan(month)} disabled={isSyncing}
                                            className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Coins className="h-4 w-4" /> Cairkan Omzet
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- SECTION 2: RIWAYAT LOG PENCAIRAN --- */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <History className="h-5 w-5 text-gray-500" /> Riwayat Pencairan
                        </h2>

                        <div className="space-y-6">
                            {logs.length === 0 ? (
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
                                    <p className="text-gray-500 text-sm">Belum ada riwayat pencairan tercatat di sistem.</p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                                        
                                        {/* --- HEADER LOG --- */}
                                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    {new Date(log.start_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono">
                                                Dieksekusi: {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* --- KOTAK PEMBAGIAN BOS-BOS --- */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Omzet Poin</div>
                                                <div className="font-mono font-bold text-gray-900 dark:text-white">{Number(log.total_point).toLocaleString('id-ID')}</div>
                                                <div className="text-[10px] text-gray-500 mt-1">{log.total_nota} Nota Valid</div>
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                                <div className="text-[10px] uppercase font-bold text-blue-600 mb-1">Jatah Rafi (35%)</div>
                                                <div className="font-mono font-bold text-blue-700 dark:text-blue-300">{Number(log.rraf_share).toLocaleString('id-ID')}</div>
                                            </div>
                                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                                <div className="text-[10px] uppercase font-bold text-indigo-600 mb-1">Jatah Aldi (65%)</div>
                                                <div className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{Number(log.aldi_share).toLocaleString('id-ID')}</div>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                                                <div className="text-[10px] uppercase font-bold text-green-600 mb-1">Total Frontliner</div>
                                                <div className="font-mono font-bold text-green-700 dark:text-green-300">{Number(log.frontliner_share).toLocaleString('id-ID')}</div>
                                            </div>
                                        </div>

                                        {/* --- RINCIAN PER ANAK (FRONT-LINER) --- */}
                                        {log.details && log.details.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                                    <FileText className="h-3 w-3" /> Rincian Penerima
                                                </h4>
                                                <div className="bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                                        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold text-xs uppercase">
                                                            <tr>
                                                                <th className="px-4 py-3">Nama Karyawan</th>
                                                                <th className="px-4 py-3 text-center">Nota</th>
                                                                <th className="px-4 py-3 text-right">Poin Kotor</th>
                                                                <th className="px-4 py-3 text-right">Cair (80%)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                            {log.details.map((user: PencairanLogDetails, idx: number) => (
                                                                <tr key={idx} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">
                                                                        {user.full_name || 'User Tidak Diketahui'}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center text-gray-500">
                                                                        {user.total_nota}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right font-mono text-gray-500">
                                                                        {Number(user.point).toLocaleString('id-ID')}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right font-mono font-bold text-green-600 dark:text-green-400">
                                                                        {Number(user.take_home).toLocaleString('id-ID')}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ))
                            )}
                        </div>
                    </div>
            </div>
        </div>
    )
}