'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertCircle } from 'lucide-react';

export default function InvoiceSearchForm() {
  const [invoiceId, setInvoiceId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!invoiceId.trim()) {
      setError('Invoice ID harus diisi');
      return;
    }

    try {
      setIsLoading(true);
      router.push(`update/${encodeURIComponent(invoiceId.trim())}`);
    } catch (err) {
      setError(`Terjadi kesalahan saat memproses permintaan ${err}`);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Container Luar: Light (Gradient) -> Dark (Pitch Black)
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 dark:bg-none dark:bg-black flex items-center justify-center p-4">
      
      {/* Card: Light (White + Shadow) -> Dark (Black + Border Tipis) */}
      <div className="bg-white dark:bg-black rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-white/10 p-8 w-full max-w-md transition-colors duration-200">
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Cari Invoice
          </h2>
          <p className="text-gray-600 dark:text-neutral-400 text-sm">
            Masukkan Invoice ID untuk update data
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="invoiceId" 
              className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2"
            >
              Invoice ID
            </label>
            <input
              type="text"
              id="invoiceId"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Contoh: GPS-"
              // Input styling: Black bg, White text, border agak terang dikit biar keliatan batasnya
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all placeholder:text-gray-400 dark:placeholder:text-neutral-600"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-3 rounded-lg">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Search size={20} />
                Cari Invoice
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}