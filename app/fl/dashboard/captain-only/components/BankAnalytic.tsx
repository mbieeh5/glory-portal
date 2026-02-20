'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { 
    Loader2, Calendar, CreditCard, Wallet, ArrowUpRight, ArrowDownRight 
} from 'lucide-react'
import { RechartsTooltipProps } from '@/config/type'

// Type untuk raw data dari database
type RawTransaction = {
    amount: number;
    type_transactions: string; // 'IN' atau 'OUT'
    entry_datetime: string;
    bank_config?: {
        bank_name: string;
    };
}

// Type untuk data Card per bank
type BankSummary = {
    bank_name: string;
    income: number;
    outcome: number;
}

// Type untuk Chart harian
type ChartDataPoint = {
    date: string;
    displayDate: string;
    pemasukan: number;
    pengeluaran: number;
}

export default function BankAnalytics() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [bankSummaries, setBankSummaries] = useState<BankSummary[]>([]) 

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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)

            // Tarik data langsung dari bank_transactions dan join ke bank_config buat ambil nama bank
            const { data, error } = await supabase
                .schema('glory')
                .from('bank_transactions')
                .select(`
                    amount,
                    type_transactions,
                    entry_datetime,
                    bank_config ( bank_name )
                `)
                .gte('entry_datetime', `${dateRange.start}T00:00:00`)
                .lte('entry_datetime', `${dateRange.end}T23:59:59`)
                .order('entry_datetime', { ascending: true })

            if (error) throw error

            if (data) {
                const typedData = data as any as RawTransaction[]; // casting type
                
                const summaryMap: Record<string, BankSummary> = {}
                const chartMap: Record<string, ChartDataPoint> = {}

                typedData.forEach(trx => {
                    const bankName = trx.bank_config?.bank_name || 'Unknown Bank';
                    const dateRaw = trx.entry_datetime.split('T')[0];
                    const amount = Number(trx.amount) || 0;
                    const isIN = trx.type_transactions.trim() === 'IN';

                    // 1. Olah data untuk Cards (Summary per Bank)
                    if (!summaryMap[bankName]) {
                        summaryMap[bankName] = { bank_name: bankName, income: 0, outcome: 0 };
                    }
                    if (isIN) summaryMap[bankName].income += amount;
                    else summaryMap[bankName].outcome += amount;

                    // 2. Olah data untuk Chart (Pemasukan vs Pengeluaran per hari)
                    if (!chartMap[dateRaw]) {
                        chartMap[dateRaw] = {
                            date: dateRaw,
                            displayDate: new Date(dateRaw).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                            pemasukan: 0,
                            pengeluaran: 0
                        };
                    }
                    if (isIN) chartMap[dateRaw].pemasukan += amount;
                    else chartMap[dateRaw].pengeluaran += amount;
                });

                // Convert map ke array
                const finalBankList = Object.values(summaryMap);
                const finalChartData = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));

                setBankSummaries(finalBankList)
                setChartData(finalChartData)
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

    const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl text-xs z-50">
                    <p className="font-bold text-gray-900 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">{label}</p>
                    {payload.map((entry: any, idx: number) => (
                        <div key={`bank-tool-${idx}`} className="flex items-center gap-2 mb-1 min-w-[150px]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600 dark:text-gray-300 font-medium capitalize">{entry.name}:</span>
                            <span className={`font-mono font-bold ml-auto ${entry.name === 'pemasukan' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatIDR(Number(entry.value))}
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    if (loading && bankSummaries.length === 0) return (
        <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-900 rounded-xl min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Header Area */}
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

            {/* Cards Area (Income vs Outcome per Bank) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {bankSummaries.map((bank) => (
                    <div key={bank.bank_name} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-colors flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    {bank.bank_name}
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                {/* Income Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
                                        <div className="p-1 bg-green-50 dark:bg-green-900/30 rounded mr-2">
                                            <ArrowUpRight className="h-3 w-3" />
                                        </div>
                                        IN
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                        {formatIDR(bank.income)}
                                    </span>
                                </div>
                                
                                {/* Outcome Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-xs text-red-600 dark:text-red-400 font-medium">
                                        <div className="p-1 bg-red-50 dark:bg-red-900/30 rounded mr-2">
                                            <ArrowDownRight className="h-3 w-3" />
                                        </div>
                                        OUT
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                        {formatIDR(bank.outcome)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Background Icon Detail */}
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                            <CreditCard className="h-24 w-24" />
                        </div>
                    </div>
                ))}
                
                {bankSummaries.length === 0 && !loading && (
                    <div className="col-span-full text-center text-gray-500 py-6 text-sm">
                        Gak ada mutasi di range tanggal ini bro.
                    </div>
                )}
            </div>

            {/* Chart Area */}
            <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Grafik Mutasi Harian (All Banks)</h3>
                
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
                            
                            <Tooltip content={<CustomTooltip active={false} payload={[]} label={''} />} />
                            
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Line
                                type="monotone"
                                dataKey="pemasukan"
                                name="Pemasukan"
                                stroke="#16a34a" // Hijau
                                strokeWidth={3}
                                dot={{ r: 3, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="pengeluaran"
                                name="Pengeluaran"
                                stroke="#dc2626" // Merah
                                strokeWidth={3}
                                dot={{ r: 3, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}