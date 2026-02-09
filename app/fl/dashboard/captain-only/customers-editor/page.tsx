'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
    ArrowLeft, 
    Search, 
    Loader2, 
    Edit, 
    Save, 
    X, 
    Landmark, 
    Smartphone,
    User,
    CreditCard,
    Hash
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type BankCustomer = {
    id: string
    customer_name: string
    customer_bank_name: string
    customer_bank_account: string
}

type ServiceCustomer = {
    id: string
    customer_name: string
    customer_id: string
    customer_phone_number: string
}

type CustomerData = BankCustomer | ServiceCustomer

export default function CustomersEditor() {
    const router = useRouter()
    const supabase = createClient()

    const [activeTab, setActiveTab] = useState<'bank' | 'service'>('bank')
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const [bankData, setBankData] = useState<BankCustomer[]>([])
    const [serviceData, setServiceData] = useState<ServiceCustomer[]>([])

    const [editingItem, setEditingItem] = useState<CustomerData | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // 1. Pake useCallback biar referensi fungsi stabil
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            if (activeTab === 'bank') {
                const { data, error } = await supabase
                    .schema('glory')
                    .from('bank_customers')
                    .select('*')
                    .order('customer_name', { ascending: true })
                
                if (error) throw error
                setBankData((data as BankCustomer[]) || [])
            } else {
                const { data, error } = await supabase
                    .schema('glory')
                    .from('services_customers')
                    .select('*')
                    .order('customer_name', { ascending: true })
                
                if (error) throw error
                setServiceData((data as ServiceCustomer[]) || [])
            }
        } catch (error) {
            console.error('Gagal tarik data:', error)
        } finally {
            setLoading(false)
        }
    }, [activeTab, supabase]) // Dependensi: tab aktif dan client supabase

    // 2. useEffect sekarang cuma manggil fetchData yang stabil
    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleEditClick = (item: CustomerData) => {
        setEditingItem(item)
        setIsModalOpen(true)
    }

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingItem) return 

        setIsSaving(true)
        try {
            const table = activeTab === 'bank' ? 'bank_customers' : 'services_customers'
            
            const { error } = await supabase
                .schema('glory')
                .from(table)
                .update(editingItem)
                .eq('id', editingItem.id)

            if (error) throw error

            if (activeTab === 'bank') {
                const updatedItem = editingItem as BankCustomer
                setBankData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item))
            } else {
                const updatedItem = editingItem as ServiceCustomer
                setServiceData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item))
            }

            setIsModalOpen(false)
            setEditingItem(null)
        } catch (error) {
            console.error('Gagal save:', error)
            alert('Gagal simpan data.')
        } finally {
            setIsSaving(false)
        }
    }

    let filteredData: CustomerData[] = []
    if (activeTab === 'bank') {
        filteredData = bankData.filter(item => 
            item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customer_bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customer_bank_account.includes(searchTerm)
        )
    } else {
        filteredData = serviceData.filter(item => 
            item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customer_phone_number?.includes(searchTerm)
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers Editor</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Database Pelanggan Bank & Service</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full md:w-auto">
                        <button 
                            onClick={() => setActiveTab('bank')}
                            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all w-1/2 md:w-auto ${
                                activeTab === 'bank' 
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <Landmark className="h-4 w-4" />
                            Bank
                        </button>
                        <button 
                            onClick={() => setActiveTab('service')}
                            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all w-1/2 md:w-auto ${
                                activeTab === 'service' 
                                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <Smartphone className="h-4 w-4" />
                            Services
                        </button>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder={activeTab === 'bank' ? "Cari Nama, Bank, No Rek..." : "Cari Nama, HP, ID..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-colors"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Pelanggan</th>
                                        {activeTab === 'bank' ? (
                                            <>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bank</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">No. Rekening</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer ID</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">No. HP</th>
                                            </>
                                        )}
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.customer_name}</td>
                                            {activeTab === 'bank' ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                            {(item as BankCustomer).customer_bank_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">{(item as BankCustomer).customer_bank_account}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">{(item as ServiceCustomer).customer_id}</td>
                                                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">{(item as ServiceCustomer).customer_phone_number}</td>
                                                </>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleEditClick(item)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                                Tidak ada data pelanggan ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800 p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Pelanggan</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveChanges} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nama Pelanggan</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editingItem.customer_name}
                                        onChange={(e) => setEditingItem({...editingItem, customer_name: e.target.value})}
                                    />
                                </div>
                            </div>

                            {activeTab === 'bank' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nama Bank</label>
                                        <div className="relative">
                                            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input 
                                                type="text" 
                                                required
                                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={(editingItem as BankCustomer).customer_bank_name}
                                                onChange={(e) => setEditingItem({
                                                    ...editingItem, 
                                                    customer_bank_name: e.target.value
                                                } as BankCustomer)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">No. Rekening</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input 
                                                type="text" 
                                                required
                                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                                value={(editingItem as BankCustomer).customer_bank_account}
                                                onChange={(e) => setEditingItem({
                                                    ...editingItem, 
                                                    customer_bank_account: e.target.value
                                                } as BankCustomer)}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Customer ID</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input 
                                                type="text" 
                                                required
                                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                                value={(editingItem as ServiceCustomer).customer_id}
                                                onChange={(e) => setEditingItem({
                                                    ...editingItem, 
                                                    customer_id: e.target.value
                                                } as ServiceCustomer)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">No. HP / WhatsApp</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input 
                                                type="text" 
                                                required
                                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                                value={(editingItem as ServiceCustomer).customer_phone_number}
                                                onChange={(e) => setEditingItem({
                                                    ...editingItem, 
                                                    customer_phone_number: e.target.value
                                                } as ServiceCustomer)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end pt-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}