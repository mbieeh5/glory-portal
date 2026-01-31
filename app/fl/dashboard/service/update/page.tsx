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

    // Validasi
    if (!invoiceId.trim()) {
      setError('Invoice ID harus diisi');
      return;
    }

    try {
      setIsLoading(true);
      // Navigate ke dynamic route
      router.push(`update/${encodeURIComponent(invoiceId.trim())}`);
    } catch (err) {
      setError(`Terjadi kesalahan saat memproses permintaan ${err}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Cari Invoice
          </h2>
          <p className="text-gray-600 text-sm">
            Masukkan Invoice ID untuk update data
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="invoiceId" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Invoice ID
            </label>
            <input
              type="text"
              id="invoiceId"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Contoh: GPS-"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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