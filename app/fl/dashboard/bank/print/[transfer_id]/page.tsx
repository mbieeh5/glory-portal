"use client";

import { BankTransaction, StatusBankEnum } from "@/config/type";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function PrintTransferPage() {
  const [data, setData] = useState<BankTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const transferId = params.transfer_id as string;

  useEffect(() => {
    // Dummy data - nanti lu ganti dengan fetch dari API
    const dummyData: BankTransaction = {
      id: 1,
      owner_id: "user-123",
      transfer_id: transferId || "TRF-2024-001",
      entry_datetime: new Date(),
      customer_id: 1,
      bank_id: "bank-001",
      type_transactions: "OUT",
      amount: 500000,
      admin_fee: 2500,
      balance_before: 1000000,
      balance_after: 497500,
      description: "Transfer ke Rekening Tabungan",
      status: StatusBankEnum.COMPLETED,
      is_check: false,
      created_at: new Date(),
      updated_at: new Date(),
      // Dummy data tambahan untuk display
      config_info: {
        id: "1234",
        bank_name: "Bank BCA",
        account_name: "rraf",
    },
    };

    // Simulate loading
    setTimeout(() => {
      setData(dummyData);
      setLoading(false);
    }, 500);
  }, [transferId]);

  const handlePrint = () => {
    const printArea = document.getElementById('printArea');
    if (printArea) {
      const printContent = printArea.innerHTML;
      const styleSheets = Array.from(document.styleSheets)
        .map((sheet) => {
          try {
            return Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join('\n');
          } catch (e) {
            console.warn("Error reading CSS rules: ", e);
            return '';
          }
        })
        .join('\n');

      const printWindow = window.open('', '', 'width=600,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
          <head>
            <title>Print Transfer - ${transferId}</title>
            <style>
              ${styleSheets}
              @media print {
                body { margin: 0; padding: 20px; }
                button { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading transaction data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-2">
            Transaction Not Found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Transfer ID: {transferId}
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Print Area */}
        <section 
          id="printArea" 
          className="bg-white px-12 py-8 rounded-lg shadow-xl text-black mb-6"
        >
          <div className="grid justify-items-center">
            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-xl font-bold tracking-tight text-gray-900">
                Glory Cell
              </p>
              <p className="text-xs leading-3 text-gray-600">
                JLN. RAYA CIKARET NO 002B
              </p>
              <p className="text-xs text-gray-600">
                CIBINONG - BOGOR
              </p>
              <p className="text-xs leading-1 text-gray-600 border-b border-gray-900 pb-2 mt-2">
                {data.entry_datetime ? formatDate(data.entry_datetime) : '-'}
              </p>
            </div>

            {/* Title */}
            <h2 className="mb-4 text-base font-medium tracking-tight text-gray-900">
              Transfer Antar Bank
            </h2>

            {/* Transaction Details */}
            <div className="w-full space-y-2">
              {/* Transfer ID */}
              <div className="flex items-center text-gray-700 font-medium text-sm">
                <span className="w-[40%]">Transfer ID</span>
                <div className="font-bold mr-2">:</div>
                <span className="font-bold text-gray-900 break-words">{data.transfer_id}</span>
              </div>

              {/* Bank Name */}
              <div className="flex items-center text-gray-700 font-medium text-sm">
                <span className="w-[40%]">Bank</span>
                <div className="font-bold mr-2">:</div>
                <span className="font-bold text-gray-900 break-words">
                  {data.transfer_info?.customer_bank_name || 'Bank BCA'}
                </span>
              </div>

              {/* Account Number */}
              <div className="flex items-center text-gray-700 font-medium text-sm">
                <span className="w-[40%]">No. Rekening</span>
                <div className="font-bold mr-2">:</div>
                <span className="font-bold text-gray-900 break-words">
                  {data.transfer_info?.customer_bank_account || '1234567890'}
                </span>
              </div>

              {/* Recipient Name */}
              <div className="flex items-start text-gray-700 font-medium text-sm">
                <span className="w-[40%]">Nama Penerima</span>
                <div className="font-bold mr-2">:</div>
                <div className="font-bold text-gray-900 break-normal flex-1">
                  {data.transfer_info?.customer_name || 'John Doe'}
                </div>
              </div>

              {/* Sender Name */}
              <div className="flex items-start text-gray-700 font-medium text-sm">
                <span className="w-[40%]">Pengirim</span>
                <div className="font-bold mr-2">:</div>
                <span className="font-bold text-gray-900 break-words flex-1">
                  {data.config_info?.account_name || 'Glory Cell - Cikaret'}
                </span>
              </div>

              {/* Description */}
              <div className="flex items-start text-gray-700 font-medium text-sm">
                <span className="w-[40%]">Berita</span>
                <div className="font-bold mr-2">:</div>
                <span className="font-bold text-gray-900 break-words flex-1">
                  {data.description || '-'}
                </span>
              </div>

              {/* Transaction Type */}
              <div className="flex items-center text-gray-700 font-medium text-sm">
                <span className="w-[40%]">Tipe Transaksi</span>
                <div className="font-bold mr-2">:</div>
                <span className="font-bold text-gray-900">
                  {data.type_transactions === 'IN' ? 'Transfer Masuk' : 'Transfer Keluar'}
                </span>
              </div>

              {/* Amount */}
              <div className="flex items-center border-b border-gray-900 py-2 text-sm">
                <span className="w-[40%] text-gray-700 font-medium">Nominal</span>
                <div className="font-bold mr-2">:</div>
                <span className="font-bold text-gray-900">
                  Rp. {formatCurrency(data.amount)}.-
                </span>
              </div>

              {/* Info Text */}
              <div className="flex text-gray-700 font-medium text-xs py-2">
                <span className="font-normal text-center w-full">
                  Struk ini sebagai bukti pembayaran yang sah mohon disimpan.
                </span>
              </div>

              {/* Admin Fee */}
              <div className="flex items-center text-gray-700 font-medium text-xs">
                <span className="w-[40%]">Biaya Admin</span>
                <div className="font-bold mr-2">:</div>
                <span className="font-bold">
                  Rp. {formatCurrency(data.admin_fee || 0)}.-
                </span>
              </div>

              {/* Total */}
              <div className="flex items-center text-gray-700 font-medium text-xs mb-4">
                <span className="w-[40%]">Total Bayar</span>
                <div className="font-bold mr-2">:</div>
                <span className="font-bold">
                  Rp. {formatCurrency(data.amount + (data.admin_fee || 0))}.-
                </span>
              </div>

              {/* Balance Info */}
              <div className="border-t border-gray-300 pt-3 space-y-1">
                <div className="flex items-center text-gray-700 font-medium text-xs">
                  <span className="w-[40%]">Saldo Sebelum</span>
                  <div className="font-bold mr-2">:</div>
                  <span className="font-bold">
                    Rp. {data.balance_before ? formatCurrency(data.balance_before) : '0'}.-
                  </span>
                </div>
                <div className="flex items-center text-gray-700 font-medium text-xs">
                  <span className="w-[40%]">Saldo Sesudah</span>
                  <div className="font-bold mr-2">:</div>
                  <span className="font-bold">
                    Rp. {data.balance_after ? formatCurrency(data.balance_after) : '0'}.-
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center pt-3">
                <span className={`px-4 py-1 text-xs font-bold rounded-full ${
                  data.status === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : data.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {data.status.toUpperCase()}
                </span>
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center text-center text-gray-700 font-medium pt-4 border-t border-gray-300 mt-4">
                <span className="font-bold text-sm">TERIMA KASIH</span>
                <span className="font-normal text-xs">CS-WA: 08811429638</span>
                <span className="font-normal text-xs text-gray-500 mt-2">
                  {data.transfer_id}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Struk
          </button>
          
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}