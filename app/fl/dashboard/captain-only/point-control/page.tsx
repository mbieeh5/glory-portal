'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
    ArrowLeft, 
    Search, 
    RefreshCcw, 
    AlertTriangle, 
    CheckCircle2, 
    Loader2,
    Edit2,
    Save,
    X,
    Wallet,
    Users,
    XCircleIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// 1. Definisiin Type biar ga pake 'any' lagi
interface UserProfile {
    id: string
    full_name: string | null
    point: number
    role: string | null
    services_target: number | null
    point_sah: number
    target: number
}

interface LegitPoint {
    user_id: string
    real_point: number
}

export default function PointControl() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    
    const [editingId, setEditingId] = useState<string | null>(null)
    const [tempTarget, setTempTarget] = useState<number>(0)

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    const [users, setUsers] = useState<UserProfile[]>([])

    // 2. Bungkus pake useCallback biar referensi function stabil
    const fetchPointData = useCallback(async () => {
        try {
            setLoading(true)
            
            const { data: profiles, error: profileError } = await supabase
                .schema('glory')
                .from('profiles')
                .select('id, full_name, point, role, services_target') 
                .eq('role', 'frontliner')
                .order('full_name', { ascending: true })

            if (profileError) throw profileError
            
            const { data: legitPoints, error: rpcError } = await supabase
                .schema('glory')
                .rpc('calculate_legit_points', { 
                    p_start_date: dateRange.start, 
                    p_end_date: dateRange.end 
                })
            
            if (rpcError) throw rpcError

            // Map data dengan type safety
            const combinedData: UserProfile[] = (profiles || []).map(user => {
                const realData = (legitPoints as unknown as LegitPoint[])?.find(lp => lp.user_id === user.id)
                return {
                    ...user,
                    point_sah: realData?.real_point ?? 0,
                    target: user.services_target ?? 0 
                }
            })

            setUsers(combinedData)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, dateRange.start, dateRange.end]) // Dependensi function

    // 3. useEffect sekarang dapet fetchPointData yang stabil
    useEffect(() => {
        fetchPointData()
    }, [fetchPointData])

    const saveTarget = async (userId: string) => {
        try {
            setIsSyncing(true)
            const { error } = await supabase
                .schema('glory')
                .from('profiles')
                .update({ services_target: tempTarget })
                .eq('id', userId)

            if (error) throw error
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, target: tempTarget } : u))
            setEditingId(null)
        } catch (error) {
            console.error('Gagal update target:', error)
            alert('Gagal update target bos')
        } finally {
            setIsSyncing(false)
        }
    }

    const handleFixPoint = async (userId: string, legitPoint: number) => {
        try {
            if(!confirm("Yakin mau update point DB sesuai data RPC?")) return

            setIsSyncing(true)
            const { error } = await supabase
                .schema('glory')
                .from('profiles')
                .update({ point: legitPoint })
                .eq('id', userId)

            if (error) throw error
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, point: legitPoint } : u))

        } catch (error) {
            console.error('Gagal fix point:', error)
            alert('Gagal sinkronisasi point.')
        } finally {
            setIsSyncing(false)
        }
    }

    const totalPointSah = users.reduce((acc, curr) => acc + curr.point_sah, 0)
    const rrafShare = totalPointSah * 0.35
    const aldiShare = totalPointSah * 0.65

    const filteredUsers = users.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
            <Loader2 className="animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 transition-colors duration-200">
            {/* ... rest of your JSX remains the same ... */}
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">Point Control</h1>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">Monitoring & Target Service</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={fetchPointData}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
                    >
                        <RefreshCcw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Data
                    </button>
                </div>

                {/* Filter */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Cari nama karyawan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
                        <input 
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            className="w-full md:w-auto px-2 md:px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-colors"
                        />
                        <input 
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            className="w-full md:w-auto px-2 md:px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-colors"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10 drop-shadow-sm md:drop-shadow-none">Karyawan</th>
                                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Point Sah</th>
                                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Target</th>
                                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">Progress</th>
                                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredUsers.map((user) => {
                                    const isDiff = user.point !== user.point_sah
                                    const unitDone = Math.floor(user.point_sah / 5000)
                                    const progressPercent = user.target > 0 ? Math.min((unitDone / user.target) * 100, 100) : 0

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 md:px-6 py-4 sticky left-0 bg-white dark:bg-gray-900 md:bg-transparent z-10 drop-shadow-sm md:drop-shadow-none">
                                                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base">{user.full_name}</div>
                                                <div className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">{user.role}</div>
                                                {isDiff && <span className="text-[10px] text-red-500 flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" /> DB: {user.point}</span>}
                                            </td>

                                            <td className="px-4 md:px-6 py-4 text-center">
                                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base md:text-lg">
                                                    {user.point_sah.toLocaleString()}
                                                </span>
                                            </td>

                                            <td className="px-4 md:px-6 py-4 text-center">
                                                {editingId === user.id ? (
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <input 
                                                            type="number" 
                                                            className="w-16 p-1 text-center text-sm border rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
                                                            value={tempTarget}
                                                            onChange={(e) => setTempTarget(Number(e.target.value))}
                                                            autoFocus
                                                        />
                                                        <button onClick={() => saveTarget(user.id)} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><Save className="h-4 w-4" /></button>
                                                        <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><X className="h-4 w-4" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="group flex items-center justify-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => { setEditingId(user.id); setTempTarget(user.target); }}>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{user.target}</span>
                                                        <Edit2 className="h-3 w-3 text-gray-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 md:px-6 py-4">
                                                <div className="flex justify-between items-center text-xs mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400 font-medium">{unitDone} / {user.target} Unit</span>
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(progressPercent)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${progressPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                            </td>

                                            <td className="px-4 md:px-6 py-4 text-right">
                                                {isDiff ? (
                                                    <button 
                                                        disabled={isSyncing}
                                                        className="text-[10px] md:text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 md:px-3 md:py-1.5 rounded-md transition-all shadow-sm disabled:opacity-50 whitespace-nowrap"
                                                        onClick={() => handleFixPoint(user.id, user.point_sah)}
                                                    >
                                                        Fix DB
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold">
                                                        {progressPercent >= 100 ? (
                                                            <div className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                <span className="hidden md:inline">VALID</span>
                                                            </div>
                                                        ) : (
                                                            <div className='text-red-600 dark:text-red-400 flex items-center gap-1'>
                                                                <XCircleIcon className="h-4 w-4" />
                                                                <span className="hidden md:inline">Not Hit</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg shadow-blue-900/20">
                        <div className="flex items-center gap-3 mb-2 opacity-90">
                            <Wallet className="h-5 w-5" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider">Total Point Sah</h3>
                        </div>
                        <div className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
                            {totalPointSah.toLocaleString()}
                        </div>
                        <p className="text-xs mt-2 text-blue-100">
                            Akumulasi dari {filteredUsers.length} frontliner
                        </p>
                    </div>

                    <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                            <Users className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Estimasi Pencairan</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Rraf (35%)</label>
                                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-mono">
                                    {rrafShare.toLocaleString()} <span className="text-sm text-gray-400 font-sans font-normal">pts</span>
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    ~ {(rrafShare / 5000).toFixed(1)} Unit Service
                                </div>
                            </div>

                            <div className="space-y-1 sm:border-l sm:border-gray-100 dark:sm:border-gray-800 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 sm:pl-8">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aldi (65%)</label>
                                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-mono">
                                    {aldiShare.toLocaleString()} <span className="text-sm text-gray-400 font-sans font-normal">pts</span>
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    ~ {(aldiShare / 5000).toFixed(1)} Unit Service
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}