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
  
  // STATE BUAT ADMIN & TOGGLE EDIT
  const [adminFee, setAdminFee] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false); // <--- State buat mode edit

  const router = useRouter();
  const params = useParams();
  const transferId = params.transfer_id as string;
  const locations = transferId?.includes('CKT') ?? false; 

  const calculateAdminMargin = useCallback((amount: number): number => {
    // ... (Rumus lu tetep sama persis di sini) ...
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
    // ... (Fetch logic sama persis) ...
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
        
        if (trxData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = trxData as any;
          const formattedData: TransactionWithRelations = {
            ...raw,
            bank_customers: Array.isArray(raw.bank_customers) ? (raw.bank_customers[0] ?? null) : (raw.bank_customers ?? null),
            bank_config: Array.isArray(raw.bank_config) ? (raw.bank_config[0] ?? null) : (raw.bank_config ?? null),
          };
          setData(formattedData);
          setAdminFee(calculateAdminMargin(formattedData.amount)); // Default admin fee
        }
      } catch (err: any) { 
        setErrorMsg(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transferId, calculateAdminMargin]);

  // Handle Print TETAP SAMA
  const handlePrint = () => {
    // Pastikan mode edit mati dulu sebelum print biar inputnya gak kecetak
    setIsEditing(false); 
    
    // Kasih delay dikit biar React sempet render ulang jadi teks biasa
    setTimeout(() => {
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
                @page { margin: 20px; size: 80mm 297mm; }
                body { 
                    margin: 0; 
                    padding: 5px; 
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    background-color: white;
                    color: black;
                }
                .printer-container { width: 78mm; margin: 0 auto; }
                </style>
            </head>
            <body>
                <div class="printer-container">${printContent}</div>
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
    }, 100);
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

  const totalPay = data.amount + adminFee;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex justify-center items-start">
      <div className="w-full max-w-md">
        
        {/* PRINT AREA */}
        <div id="printArea" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', color: 'black', padding: '10px', backgroundColor: 'white' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: "bold" }}>
            <div style={{ fontSize: '16px'}}>GLORY CELL</div>
            <div>{locations ? "JLN. RAYA CIKARET NO 002B" : "JLN. RAYA SUKAHATI NO 01"}</div>
            <div>CIBINONG - BOGOR</div>
            <div style={{ marginTop: '5px', fontWeight: 'bold' }}>{formatDate(data.entry_datetime)}</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '10px', textDecoration: 'underline', fontWeight: 'bold' }}>
            BUKTI TRANSFER
          </div>

          {/* ... DETAIL CUSTOMER (SAMA AJA, GAK ADA UBAHAN) ... */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold'}}>
            <span>No. Rekening</span>
            <span>{data.bank_customers?.customer_bank_account || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold' }}>
            <span>Bank Tujuan</span>
            <span style={{textTransform: 'uppercase' }}>{data.bank_customers?.customer_bank_name || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold' }}>
            <span>Nama</span>
            <span style={{textTransform: 'uppercase', textAlign: 'right', maxWidth: '60%' }}>{data.bank_customers?.customer_name || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: "bold"}}>
            <span>Pengirim</span>
            <span style={{textTransform: 'uppercase' }}>{data.bank_config?.account_name || 'BANK'}</span>
          </div>
          {data.description && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight:'bold' }}>
              <span>Berita</span>
              <span style={{ textTransform: 'uppercase', fontSize: '10px' }}>{data.description}</span>
            </div>
          )}

          <div style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Nominal</span>
            <span style={{ fontWeight: 'bold' }}>Rp {formatCurrency(data.amount)}</span>
          </div>

          {/* === BAGIAN EDITABLE ADMIN FEE === */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', alignItems: 'center' }}>
            <span>Biaya Admin</span>
            
            {isEditing ? (
              /* MODE EDIT: MUNCUL INPUT KECIL */
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Rp</span>
                <input
                  autoFocus
                  className="text-black dark:text-white"
                  type="number"
                  value={adminFee}
                  onChange={(e) => setAdminFee(Number(e.target.value))}
                  onBlur={() => setIsEditing(false)} // Klik luar -> Save
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)} // Enter -> Save
                  style={{
                    width: '60px',
                    textAlign: 'right',
                    border: '1px solid black',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    padding: '2px'
                  }}
                />
              </div>
            ) : (
              /* MODE VIEW: TEXT BIASA (BISA DIKLIK) */
              <span 
                onClick={() => setIsEditing(true)} 
                style={{ fontWeight: 'bold', cursor: 'pointer', borderBottom: '1px dotted #ccc' }}
                title="Klik untuk ubah admin"
              >
                Rp {formatCurrency(adminFee)}
              </span>
            )}
          </div>

          <div style={{ borderTop: '2px solid black', margin: '8px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '14px' }}>
            <span style={{ fontWeight: 'bold' }}>TOTAL</span>
            <span style={{ fontWeight: 'bold' }}>Rp {formatCurrency(totalPay)}</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold', border: '1px solid black', padding: '2px', display: 'inline-block', marginLeft: 'auto', marginRight: 'auto', width: '100%' }}>
            {data.status === 'completed' ? 'LUNAS / SUKSES' : data.status.toUpperCase()}
          </div>

          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '15px' ,fontWeight: 'bold'}}>
            <div>TERIMA KASIH</div>
            <div>CS-WA: {locations ? "08811429638" : "08973997575"}</div>
            <div style={{ marginTop: '5px' }}>REF: {data.transfer_id}</div>
          </div>

        </div>

        {/* BUTTONS */}
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