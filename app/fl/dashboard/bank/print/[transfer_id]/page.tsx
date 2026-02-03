"use client";

import { createClient } from "@/lib/supabase/client"; 
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

// Interface (Tetap sama)
interface TransactionWithRelations {
  id: number;
  transfer_id: string;
  entry_datetime: string;
  amount: number;
  description: string | null;
  status: string;
  bank_customers: {
    customer_name: string;
    customer_bank_account: string;
    customer_bank_name: string;
  } | null;
  bank_config: {
    bank_name: string;
    account_name: string;
  } | null;
}

export default function PrintTransferPage() {
  const [data, setData] = useState<TransactionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const params = useParams();
  const transferId = params.transfer_id as string;
  const locations = transferId ? transferId.includes('CKT') ? true : false : false;

  // Logic Admin Fee (Tetap sama)
  const calculateAdminMargin = useCallback((amount: number): number => {
    if (amount <= 0) return 0;
    if (amount <= 500_000) return 5_000;
    if (amount <= 1_000_000) return 10_000;
    if (amount <= 3_000_000) return 15_000;
    if (amount <= 5_000_000) return 20_000;
    if (amount <= 10_000_000) return 25_000;
    const maxTier = 10_000_000;
    const maxFee = 25_000;
    const remainder = amount - maxTier;
    return maxFee + calculateAdminMargin(remainder);
  }, []);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transferId) return;
      const supabase = createClient();
      
      try {
        const { data: trxData, error } = await supabase
          .schema('glory')
          .from('bank_transactions')
          .select(`
            id, transfer_id, entry_datetime, amount, description, status,
            bank_customers (customer_name, customer_bank_account, customer_bank_name),
            bank_config (bank_name, account_name)
          `)
          .eq('transfer_id', transferId)
          .single();

        if (error) throw error;
        if (!trxData) throw new Error("Transaksi tidak ditemukan");

        setData(trxData as unknown as TransactionWithRelations);
      } catch (err) {
        console.error("Error fetching struk:", err);
        setErrorMsg("error");
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transferId]);

  const handlePrint = () => {
    const printArea = document.getElementById('printArea');
    if (printArea) {
      const printContent = printArea.innerHTML;
      const printWindow = window.open('', '', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
          <head>
            <title>Struk - ${transferId}</title>
            <style>
              /* Reset CSS untuk Printer Thermal */
              @page { margin: 0; size: 80mm 297mm; } /* Ukuran Kertas Thermal */
              body { 
                margin: 0; 
                padding: 5px; 
                font-family: 'Courier New', Courier, monospace; /* Wajib Monospace */
                font-size: 12px;
                background-color: white;
                color: black;
              }
              .printer-container {
                width: 78mm; /* Sedikit kurang dari 80mm biar aman */
                margin: 0 auto;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { fontWeight: bold; }
              .uppercase { text-transform: uppercase; }
              
              /* Layout Flex buat Baris Rapi */
              .row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px; /* Jarak antar baris */
              }
              .label {
                white-space: nowrap; /* Label jangan turun baris */
                margin-right: 5px;
              }
              .value {
                text-align: right;
                word-break: break-all; /* Kalau kepanjangan dipotong */
                font-weight: bold;
              }
              
              .divider {
                border-top: 1px dashed black;
                margin: 8px 0;
                width: 100%;
              }
              .double-divider {
                border-top: 2px solid black;
                margin: 8px 0;
                width: 100%;
              }
              .footer {
                margin-top: 15px;
                font-size: 10px;
                text-align: center;
              }
              button { display: none !important; }
            </style>
          </head>
          <body>
            <div class="printer-container">
              ${printContent}
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 300);
      }
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID').format(amount);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).replace('.', ':');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (errorMsg || !data) return <div className="min-h-screen flex items-center justify-center">Error: {errorMsg}</div>;

  const adminFee = calculateAdminMargin(data.amount);
  const totalPay = data.amount + adminFee;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex justify-center items-start">
      <div className="w-full max-w-md">
        
        {/* === PRINT AREA START === */}
        {/* Kita styling manual pake style={{}} biar ke-copy ke print window tanpa class Tailwind yg ribet */}
        <div id="printArea" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', color: 'black' }}>
          
          {/* HEADER */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>GLORY CELL</div>
            <div>{locations ? "JLN. RAYA CIKARET NO 002B" : "JLN. RAYA SUKAHATI NO 01"}</div>
            <div>CIBINONG - BOGOR</div>
            <div style={{ marginTop: '5px', fontWeight: 'bold' }}>{formatDate(data.entry_datetime)}</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '10px', textDecoration: 'underline', fontWeight: 'bold' }}>
            BUKTI TRANSFER
          </div>

          {/* DETAIL */}
          {/* Kita pake div biasa dengan style flex biar rapi kanan-kiri */}
          
          {/* No. Rekening */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>No. Rekening</span>
            <span style={{ fontWeight: 'bold' }}>{data.bank_customers?.customer_bank_account || '-'}</span>
          </div>

          {/* Bank */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Bank Tujuan</span>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{data.bank_customers?.customer_bank_name || '-'}</span>
          </div>

          {/* Nama Penerima */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Nama</span>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'right', maxWidth: '60%' }}>
              {data.bank_customers?.customer_name || '-'}
            </span>
          </div>

          {/* Pengirim */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Pengirim</span>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{data.bank_config?.account_name || 'BANK'}</span>
          </div>

          {/* Berita (Kalo ada) */}
          {data.description && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Berita</span>
              <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px' }}>{data.description}</span>
            </div>
          )}

          {/* DIVIDER PUTUS-PUTUS */}
          <div style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>

          {/* NOMINAL & ADMIN */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Nominal</span>
            <span style={{ fontWeight: 'bold' }}>Rp {formatCurrency(data.amount)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Biaya Admin</span>
            <span style={{ fontWeight: 'bold' }}>Rp {formatCurrency(adminFee)}</span>
          </div>

          {/* DIVIDER SOLID (TEBAL) */}
          <div style={{ borderTop: '2px solid black', margin: '8px 0' }}></div>

          {/* TOTAL */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '14px' }}>
            <span style={{ fontWeight: 'bold' }}>TOTAL</span>
            <span style={{ fontWeight: 'bold' }}>Rp {formatCurrency(totalPay)}</span>
          </div>

          {/* STATUS */}
          <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold', border: '1px solid black', padding: '2px', display: 'inline-block', marginLeft: 'auto', marginRight: 'auto', width: '100%' }}>
            {data.status === 'completed' ? 'LUNAS / SUKSES' : data.status.toUpperCase()}
          </div>

          {/* FOOTER */}
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '15px' ,fontWeight: 'bold'}}>
            <div>TERIMA KASIH</div>
            <div>CS-WA: {locations ? "08811429638" : "08973997575"}</div>
            <div style={{ marginTop: '5px' }}>REF: {data.transfer_id}</div>
          </div>

        </div>
        {/* === PRINT AREA END === */}

        {/* Tombol Action (Gak ikut ke-print) */}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg"
          >
            CETAK STRUK
          </button>
          
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-6 py-3 rounded-full font-bold shadow-sm"
          >
            KEMBALI
          </button>
        </div>

      </div>
    </div>
  );
}