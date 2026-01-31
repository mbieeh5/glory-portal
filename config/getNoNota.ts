import { createClient } from "@/lib/supabase/client";


// Tambahin async karena kita butuh fetch ke DB
export async function GetNoNota(location: string | null): Promise<string> {
    const supabase = createClient()
    // Kita lakukan "dummy insert" atau gunakan RPC untuk ambil ID selanjutnya
    // Tapi cara paling aman & akurat adalah insert data dummy atau query sequence
    // Namun, cara terbaik buat lu sekarang adalah nembak ID lewat select saat insert.
    
    // Kalau lu cuma pengen "preview" nomor nota di UI sebelum di-save:
    const { data, error } = await supabase.schema('glory')
        .rpc('preview_next_invoice_id', { p_location: location });

    if (error) {
        console.error(error);
        return "ERROR-ID";
    }

    return data;
}