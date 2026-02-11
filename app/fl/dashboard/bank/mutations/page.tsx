
import MutationsClient from "@/components/MutationClient";
import { createClient } from "@/lib/supabase/server";

// Biar datanya selalu fresh tiap refresh (Server Side Rendering)
//export const dynamic = "force-dynamic";

export default async function MutasiPage() {
  const supabase = await createClient();
  try {
    const today = new Date(new Date().setHours(0,0,0,0)).toISOString();
    // 1. Fetch Data Transaksi + Join Customer + Join Config Bank
    const { data: rawData, error } = await supabase
      .schema("glory") // Wajib panggil schema 'glory'
      .from("bank_transactions")
      .select(`
        *,
        bank_customers (
          customer_name,
          customer_bank_account,
          customer_bank_name
        ),
        bank_config (
          bank_name
        )
      `)
      .or(`created_at.gte.${today},status.eq.pending`)
      .order("created_at", { ascending: false }) // Urutkan dari yang terbaru

    if (error) {
      console.error("🔥 Supabase Error:", error.message);
      // Kalo error, kasih array kosong biar UI gak crash
      return <MutationsClient initialData={[]} />;
    }

    // 2. Data Transformation (Flattening)
    // Ratain data nested dari Supabase biar enak dibaca TanStack Table
    const formattedData = (rawData || []).map((item) => {
      // Handle Relasi: Supabase kadang balikin array/object tergantung tipe relasi
      // Karena ini Many-to-One (1 Transaksi punya 1 Customer), kita ambil objectnya
      const customer = Array.isArray(item.bank_customers)
        ? item.bank_customers[0]
        : item.bank_customers;

      const bank = Array.isArray(item.bank_config)
        ? item.bank_config[0]
        : item.bank_config;

      // Logic Deteksi Lokasi dari ID Transfer
      // Asumsi format ID lu: "CKT-..." atau "SKH-..."
      const BranchLocation: Record<string, string> = {
        CKT: "Cikaret",
        SKH: "Sukahati",
      };
      const trfId = item.transfer_id || "";
      const prefix = trfId.split('-')[0]
      const location = BranchLocation[prefix] || "unknown"

      return {
        id: item.id,
        transfer_id: trfId,
        entry_datetime: item.entry_datetime, // ISO String dari Supabase
        amount: item.amount,
        type_transactions: item.type_transactions,
        status: item.status,
        description: item.description,
        created_at: item.created_at,

        // Flattened Fields (Ambil dari tabel relasi)
        customer_name: customer?.customer_name || item.description,
        customer_bank_account: customer?.customer_bank_account || "-",
        customer_bank_name: customer?.customer_bank_name || "-",
        bank_name: bank?.bank_name || "Unknown Bank", // Bank Sumber (Milik Kita)

        location: location,
      };
    });

    // 3. Lempar data mateng ke Client Component
    return <MutationsClient initialData={formattedData} />;
    
  } catch (err) {
    console.error("💥 Server Error:", err);
    return <MutationsClient initialData={[]} />;
  }
}