'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { 
    Loader2, PackageCheck, PackageX, Clock, RefreshCcw, TrendingUp, Inbox
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { RechartsTooltipProps } from '@/config/type'

type ServiceAnalyticsRow = {
    month_key: string
    display_month: string
    total_completed: number
    total_canceled: number
    completed_unpicked: number
    canceled_unpicked: number
    total_pending: number
    total_incoming: number
}

export default function ServiceAnalytics() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ServiceAnalyticsRow[]>([])
    const [summary, setSummary] = useState({
        incoming: 0,
        pending: 0,
        unpicked_success: 0,
        unpicked_failed: 0
    })

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const { data: stats, error } = await supabase
                .schema('glory')
                .from('view_service_analytics')
                .select('*')
                .order('month_key', { ascending: false })
                .limit(6) // Ambil 6 bulan terakhir aja biar gak sesek grafiknya

            if (error) throw error

            if (stats) {
                const typedStats = stats as ServiceAnalyticsRow[]
                // Urutkan dari bulan terlama ke terbaru buat grafik
                setData([...typedStats].reverse())

                // Hitung total buat Card (diambil dari data bulan terbaru/total)
                const totalIncoming = typedStats.reduce((acc, curr) => acc + (curr.total_incoming || 0), 0)
                const totalPending = typedStats.reduce((acc, curr) => acc + (curr.total_pending || 0), 0)
                const totalUnpickedSuccess = typedStats.reduce((acc, curr) => acc + (curr.completed_unpicked || 0), 0)
                const totalUnpickedFailed = typedStats.reduce((acc, curr) => acc + (curr.canceled_unpicked || 0), 0)

                setSummary({
                    incoming: totalIncoming,
                    pending: totalPending,
                    unpicked_success: totalUnpickedSuccess,
                    unpicked_failed: totalUnpickedFailed
                })
            }
        } catch (error) {
            console.error('Gagal tarik data grafik:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-gray-900 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={`tooltip-item-${index}`} className="flex items-center gap-3 mb-1.5 min-w-[140px]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                                {entry.name === 'total_incoming' ? 'Unit Masuk' : 
                                 entry.name === 'total_completed' ? 'Berhasil' : 
                                 entry.name === 'total_canceled' ? 'Gagal' : entry.name}:
                            </span>
                            <span className="font-mono font-bold ml-auto text-gray-900 dark:text-white">
                                {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    if (loading) return (
        <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-900 rounded-xl min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Service Performance
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monitoring load barang vs penyelesaian</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900"
                >
                    <RefreshCcw className="h-4 w-4 text-gray-500" />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Incoming Card */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Inbox size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Masuk</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{summary.incoming}</div>
                    <p className="text-[10px] text-blue-600 mt-1 uppercase font-bold tracking-wider">Unit diterima</p>
                    <Inbox className="absolute -right-2 -bottom-2 h-12 w-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" />
                </div>

                {/* Pending Card */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <Clock size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Queue / Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{summary.pending}</div>
                    <p className="text-[10px] text-yellow-600 mt-1 uppercase font-bold tracking-wider">Antrian teknisi</p>
                    <Clock className="absolute -right-2 -bottom-2 h-12 w-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" />
                </div>

                {/* Ready/Unpicked Card */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <PackageCheck size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Siap Ambil</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{summary.unpicked_success}</div>
                    <p className="text-[10px] text-green-600 mt-1 uppercase font-bold tracking-wider">Selesai Berhasil</p>
                    <PackageCheck className="absolute -right-2 -bottom-2 h-12 w-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" />
                </div>

                {/* Gagal/Numpuk Card */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group border-l-4 border-l-red-500">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                            <PackageX size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gagal/Cancel</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{summary.unpicked_failed}</div>
                    <p className="text-[10px] text-red-600 mt-1 uppercase font-bold tracking-wider">Barang retur/numpuk</p>
                    <PackageX className="absolute -right-2 -bottom-2 h-12 w-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" />
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Barang Masuk vs Penyelesaian</h3>
                </div>
                
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                            <XAxis 
                                dataKey="display_month" 
                                stroke="#9CA3AF" 
                                fontSize={11} 
                                tickLine={false} 
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis 
                                stroke="#9CA3AF" 
                                fontSize={11} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Legend 
                                verticalAlign="top" 
                                align="right"
                                iconType="rect"
                                wrapperStyle={{ paddingBottom: '20px', fontSize: '11px' }}
                            />
                            
                            <Bar 
                                name="Unit Masuk" 
                                dataKey="total_incoming" 
                                fill="#3b82f6" 
                                radius={[4, 4, 0, 0]} 
                                barSize={15}
                            />
                            <Bar 
                                name="Berhasil" 
                                dataKey="total_completed" 
                                fill="#22c55e" 
                                radius={[4, 4, 0, 0]} 
                                barSize={15}
                            />
                            <Bar 
                                name="Gagal" 
                                dataKey="total_canceled" 
                                fill="#ef4444" 
                                radius={[4, 4, 0, 0]} 
                                barSize={15}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}