'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
} from 'recharts'
import { 
    Loader2, 
    Calendar, 
    CreditCard, 
    Wallet,
    ArrowUpRight
} from 'lucide-react'
import { CustomTooltipProps } from './ServiceAnalytic'

const COLORS = ['#2563eb', '#16a34a', '#db2777', '#ca8a04', '#9333ea', '#0891b2']

type BankAnalyticsRow = {
    transaction_date: string 
    bank_name: string
    total_amount: number
    total_count: number
}

type ChartDataPoint = {
    date: string
    displayDate: string
    [key: string]: string | number 
}

export default function BankAnalytics() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [bankList, setBankList] = useState<string[]>([]) 
    const [totals, setTotals] = useState<Record<string, number>>({}) 

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val)
    }

    // 2. Fix Warning: Bungkus fetchData pake useCallback
    const fetchData = useCallback(async () => {
        try {
            setLoading(true)

            const { data, error } = await supabase
                .schema('glory')
                .from('view_bank_analytics')
                .select('*')
                .gte('transaction_date', dateRange.start)
                .lte('transaction_date', dateRange.end)
                .order('transaction_date', { ascending: true })

            if (error) throw error

            if (data) {
                const typedData = data as BankAnalyticsRow[]
                const uniqueBanks = Array.from(new Set(typedData.map(item => item.bank_name)))
                setBankList(uniqueBanks)

                const newTotals: Record<string, number> = {}
                uniqueBanks.forEach(bank => newTotals[bank] = 0)

                const processedChartData = typedData.reduce<ChartDataPoint[]>((acc, curr) => {
                    const dateKey = curr.transaction_date 
                    const existingEntry = acc.find(item => item.date === dateKey)

                    if (newTotals[curr.bank_name] !== undefined) {
                        newTotals[curr.bank_name] += curr.total_amount
                    }

                    if (existingEntry) {
                        existingEntry[curr.bank_name] = curr.total_amount
                    } else {
                        acc.push({
                            date: dateKey,
                            displayDate: new Date(dateKey).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                            [curr.bank_name]: curr.total_amount
                        })
                    }
                    return acc
                }, [])

                setTotals(newTotals)
                setChartData(processedChartData)
            }

        } catch (error) {
            console.error('Gagal tarik data bank:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, dateRange.start, dateRange.end]) 

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // 3. Fix Error: Tooltip typed properly
    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-gray-900 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">{label}</p>
                    {payload.map((entry, idx) => (
                        <div key={`bank-tool-${idx}`} className="flex items-center gap-2 mb-1 min-w-[150px]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600 dark:text-gray-300 font-medium">{entry.name}:</span>
                            <span className="font-mono font-bold ml-auto text-gray-900 dark:text-white">
                                {formatIDR(Number(entry.value))}
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    if (loading && bankList.length === 0) return (
        <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-900 rounded-xl min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-green-600" />
                        Bank Mutations Control
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monitoring arus kas masuk per bank</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Calendar className="h-4 w-4 text-gray-400 ml-2" />
                    <input 
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        className="bg-transparent border-none text-xs md:text-sm text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer outline-none"
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                        className="bg-transparent border-none text-xs md:text-sm text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {bankList.map((bank) => (
                    <div key={bank} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{bank}</span>
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-mono tracking-tight">
                            {formatIDR(totals[bank])}
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                            <CreditCard className="h-24 w-24" />
                        </div>
                        <div className="mt-2 flex items-center text-[10px] text-green-600 font-medium">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Total periode ini
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Grafik Mutasi Harian</h3>
                
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                            
                            <XAxis 
                                dataKey="displayDate" 
                                stroke="#9CA3AF" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                dy={10}
                                minTickGap={30}
                            />
                            
                            <YAxis 
                                stroke="#9CA3AF" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => `${val / 1000}k`} 
                            />
                            
                            <Tooltip content={<CustomTooltip />} />
                            
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            {bankList.map((bank, idx) => (
                                <Line
                                    key={bank}
                                    type="monotone"
                                    dataKey={bank}
                                    stroke={COLORS[idx % COLORS.length]} 
                                    strokeWidth={3}
                                    dot={{ r: 3, strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    connectNulls 
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}