'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
} from 'recharts'
import { 
    Loader2, 
    PackageCheck, 
    PackageX, 
    Clock, 
    RefreshCcw,
    TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// 1. Definisi Tipe Data
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

type SummaryState = {
    pending: number
    unpicked_success: number
    unpicked_failed: number
}

interface TooltipPayloadEntry {
    name: string;
    value: number;
    color: string;
    // tambahin properti lain kalo lu butuh
}

export interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
}


export default function ServiceAnalytics() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    
    const [data, setData] = useState<ServiceAnalyticsRow[]>([])
    const [summary, setSummary] = useState<SummaryState>({
        pending: 0,
        unpicked_success: 0,
        unpicked_failed: 0
    })

    // 2. Fix Warning: Pake useCallback biar referensi fetchData stabil
    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            
            const { data: stats, error } = await supabase
                .schema('glory')
                .from('view_service_analytics')
                .select('*')
                .limit(12)

            if (error) throw error

            if (stats) {
                const typedStats = stats as ServiceAnalyticsRow[]
                const reversedData = [...typedStats].reverse()
                setData(reversedData)

                // Hitung Summary dengan type safety
                const totalPending = typedStats.reduce((acc, curr) => acc + (curr.total_pending || 0), 0)
                const totalUnpickedSuccess = typedStats.reduce((acc, curr) => acc + (curr.completed_unpicked || 0), 0)
                const totalUnpickedFailed = typedStats.reduce((acc, curr) => acc + (curr.canceled_unpicked || 0), 0)

                setSummary({
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
    }, [supabase]) // Dependency supabase client

    useEffect(() => {
        fetchData()
    }, [fetchData]) // Sekarang aman masukin fetchData ke sini

    // 3. Fix Error: Pake TooltipProps bawaan Recharts
    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    // Check 'active' dan 'payload' ada isinya gak
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg text-xs md:text-sm">
                <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                {/* 'entry' di sini udah otomatis punya tipe, gak perlu ': any' lagi */}
                {payload.map((entry, index) => (
                    <div key={`tooltip-item-${index}`} className="flex items-center gap-2 mb-1">
                        <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: entry.color }} 
                        />
                        <span className="text-gray-600 dark:text-gray-300 capitalize">
                            {entry.name === 'total_completed' ? 'Berhasil' : 
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Service Analytics
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Performa bulanan & barang numpuk</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <RefreshCcw className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="h-16 w-16 text-yellow-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono pl-1">
                        {summary.pending}
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 pl-1">Unit belum dikerjakan</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PackageCheck className="h-16 w-16 text-green-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <PackageCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Selesai (Unpicked)</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono pl-1">
                        {summary.unpicked_success}
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1 pl-1">Siap cair tapi belum diambil</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PackageX className="h-16 w-16 text-red-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <PackageX className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gagal (Unpicked)</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono pl-1">
                        {summary.unpicked_failed}
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-1 pl-1">Cancel/Gagal & numpuk di toko</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Grafik Volume Service Bulanan</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                            <XAxis 
                                dataKey="display_month" 
                                stroke="#9CA3AF" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis 
                                stroke="#9CA3AF" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend 
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="circle"
                            />
                            <Bar 
                                name="total_completed" 
                                dataKey="total_completed" 
                                fill="#22c55e" 
                                radius={[4, 4, 0, 0]} 
                                barSize={20}
                                stackId="a"
                            />
                            <Bar 
                                name="total_canceled" 
                                dataKey="total_canceled" 
                                fill="#ef4444" 
                                radius={[4, 4, 0, 0]} 
                                barSize={20}
                                stackId="b"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}