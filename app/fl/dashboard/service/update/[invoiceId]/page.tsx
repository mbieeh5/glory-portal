import { Suspense } from 'react';
import UpdateInvoiceClient from './UpdateInvoiceClient';
import { getInvoiceData } from '@/lib/services/invoice-action.services';

export default async function UpdateDataInvoiceId({ 
    params 
}: { 
    params: Promise<{ invoiceId: string }> 
}) {
    const { invoiceId } = await params;
    
    // Fetch data dari server - integrate dengan RLS nanti
    const invoiceData = await getInvoiceData(invoiceId);
    
    if (!invoiceData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Invoice Tidak Ditemukan
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Invoice ID: <span className="font-mono">{invoiceId}</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<LoadingState />}>
            <UpdateInvoiceClient initialData={invoiceData} invoiceId={invoiceId} />
        </Suspense>
    );
}

function LoadingState() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
    );
}