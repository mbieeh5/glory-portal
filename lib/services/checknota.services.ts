import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
)

// --- TYPES ---
interface NotaCheckResponse {
    found: boolean;
    requiresVerification: boolean;
    last5Digits?: string;
    data?: {
        nomorNota: string;
        nama: string;
        layanan: string;
        nomorHp: string;
        status: string;
        tanggal: string;
        total: string;
    };
    error?: string;
}

// --- HELPER: SENSOR NAMA ---
function sensorNama(nama: string): string {
    const parts = nama.split(" ");
    return parts
        .map((part) => {
            if (part.length <= 2) return part; // Nama pendek gak disensor
            return part[0] + "*".repeat(part.length - 1);
        })
        .join(" ");
}

// --- HELPER: SENSOR HP ---
function sensorHP(nomorHp: string): string {
    if (nomorHp.length < 7) return nomorHp; // Kalo nomor terlalu pendek, return as is
    const firstFour = nomorHp.slice(0, 4);
    const lastThree = nomorHp.slice(-3);
    const middle = "*".repeat(nomorHp.length - 7);
    return `${firstFour}${middle}${lastThree}`;
}

// --- STEP 1: CHECK NOTA (TANPA DATA SENSITIF) ---
export async function checkNotaExists(invoiceId: string): Promise<NotaCheckResponse> {
    try {
        // 1. Cari transaction berdasarkan invoice_id
        const { data: transaction, error: transactionError } = await supabase
            .schema('glory')
            .from('services_transactions')
            .select('invoice_id, customer_name')
            .eq('invoice_id', invoiceId.toUpperCase())
            .single();

        if (transactionError || !transaction) {
            return {
                found: false,
                requiresVerification: false,
                error: 'Nota tidak ditemukan di sistem.'
            };
        }

        // 2. Cari customer berdasarkan nama dari transaction
        const { data: customer, error: customerError } = await supabase
            .schema('glory')
            .from('services_customers')
            .select('nomor_hp')
            .eq('nama', transaction.customer_name)
            .single();

        if (customerError || !customer) {
            return {
                found: true,
                requiresVerification: false,
                error: 'Data pelanggan tidak ditemukan. Hubungi admin.'
            };
        }

        // 3. Return success dengan last5Digits untuk verifikasi
        const last5Digits = customer.nomor_hp.slice(-5);

        return {
            found: true,
            requiresVerification: true,
            last5Digits, // Ini HANYA untuk backend verification, jangan expose ke frontend
        };

    } catch (error) {
        console.error('Error checking nota:', error);
        return {
            found: false,
            requiresVerification: false,
            error: 'Terjadi kesalahan sistem.'
        };
    }
}

// --- STEP 2: VERIFY & GET FULL DATA ---
export async function verifyAndGetNotaData(
    invoiceId: string, 
    inputLast5Digits: string
): Promise<NotaCheckResponse> {
    try {
        // 1. Check nota exists dan get last5Digits
        const checkResult = await checkNotaExists(invoiceId);
        if (!checkResult.found || !checkResult.requiresVerification) {
            return checkResult;
        }

        // 2. Verify OTP
        if (checkResult.last5Digits !== inputLast5Digits) {
            return {
                found: true,
                requiresVerification: true,
                error: 'Verifikasi gagal. Nomor HP tidak sesuai.'
            };
        }

        // 3. Fetch full transaction data
        const { data: transaction, error: transactionError } = await supabase
            .schema('glory')
            .from('services_transactions')
            .select('*')
            .eq('invoice_id', invoiceId.toUpperCase())
            .single();

        if (transactionError || !transaction) {
            return {
                found: false,
                requiresVerification: false,
                error: 'Gagal mengambil data transaksi.'
            };
        }

        // 4. Fetch customer data
        const { data: customer, error: customerError } = await supabase
            .schema('glory')
            .from('services_customers')
            .select('nomor_hp')
            .eq('nama', transaction.customer_name)
            .single();

        if (customerError || !customer) {
            return {
                found: true,
                requiresVerification: false,
                error: 'Data pelanggan tidak ditemukan.'
            };
        }

        // 5. Format tanggal
        const tanggalMasuk = new Date(transaction.entry_datetime);
        const formattedDate = tanggalMasuk.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // 6. Format total biaya
        const totalBiaya = `Rp ${transaction.final_price.toLocaleString('id-ID')}`;

        // 7. Return data dengan sensor
        return {
            found: true,
            requiresVerification: false,
            data: {
                nomorNota: transaction.invoice_id,
                nama: sensorNama(transaction.customer_name),
                layanan: transaction.complaint,
                nomorHp: sensorHP(customer.nomor_hp),
                status: transaction.status,
                tanggal: formattedDate,
                total: totalBiaya,
            }
        };

    } catch (error) {
        console.error('Error verifying nota:', error);
        return {
            found: false,
            requiresVerification: false,
            error: 'Terjadi kesalahan sistem.'
        };
    }
}

// --- ALTERNATIVE: ONE-STEP FUNCTION (SIMPLIFIED) ---
// Kalo lo mau simple aja tanpa dua step
export async function getNotaDataWithVerification(
    invoiceId: string,
    inputLast5Digits: string
): Promise<NotaCheckResponse> {
    try {
        // 1. Fetch transaction
        const { data: transaction, error: transactionError } = await supabase
            .schema('glory')
            .from('services_transactions')
            .select('*')
            .eq('invoice_id', invoiceId.toUpperCase())
            .single();

        if (transactionError || !transaction) {
            return {
                found: false,
                requiresVerification: false,
                error: 'Nota tidak ditemukan di sistem.'
            };
        }

        // 2. Fetch customer
        const { data: customer, error: customerError } = await supabase
            .schema('glory')
            .from('services_customers')
            .select('nomor_hp')
            .eq('nama', transaction.customer_name)
            .single();

        if (customerError || !customer) {
            return {
                found: true,
                requiresVerification: false,
                error: 'Data pelanggan tidak ditemukan.'
            };
        }

        // 3. Verify last 5 digits
        const actualLast5 = customer.nomor_hp.slice(-5);
        if (actualLast5 !== inputLast5Digits) {
            return {
                found: true,
                requiresVerification: true,
                error: 'Verifikasi gagal. Nomor HP tidak sesuai.'
            };
        }

        // 4. Format data
        const tanggalMasuk = new Date(transaction.entry_datetime);
        const formattedDate = tanggalMasuk.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const totalBiaya = `Rp ${transaction.final_price.toLocaleString('id-ID')}`;

        // 5. Return verified data
        return {
            found: true,
            requiresVerification: false,
            data: {
                nomorNota: transaction.invoice_id,
                nama: sensorNama(transaction.customer_name),
                layanan: transaction.complaint,
                nomorHp: sensorHP(customer.nomor_hp),
                status: transaction.status,
                tanggal: formattedDate,
                total: totalBiaya,
            }
        };

    } catch (error) {
        console.error('Error getting nota data:', error);
        return {
            found: false,
            requiresVerification: false,
            error: 'Terjadi kesalahan sistem.'
        };
    }
}