"use server"
import { ServiceTransaction, SparepartPayload } from '@/config/type';
import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function getInvoiceData(invoiceId: string): Promise<ServiceTransaction | null> {
    const supabase = await createClient();
    const globalSchema = 'glory';
    
    try {
        // 1. Fetch transaction dulu
        const { data: transaction, error: transactionError } = await supabase
            .schema(globalSchema)
            .from('services_transactions')
            .select('*')
            .eq('invoice_id', invoiceId)
            .maybeSingle();

        if (transactionError) {
            console.error('Error fetching transaction:', transactionError);
            return null;
        }
        
        if (!transaction) {
            console.error('No transaction found for invoice:', invoiceId);
            return null;
        }

        // 2. Fetch spareparts
        const { data: spareparts, error: sparepartsError } = await supabase
            .schema(globalSchema)
            .from('v_all_service_spareparts')
            .select(`*`)
            .eq('invoice_id', invoiceId);
        
        if (sparepartsError) {
            console.error('Error fetching spareparts:', sparepartsError);
        }

        // 3. Fetch customer 
        const { data: customer, error: customerError } = await supabase
            .schema(globalSchema)
            .from('services_customers')
            .select('customer_name, customer_phone_number')
            .eq('customer_id', transaction.customer_id) // atau sesuaikan field-nya
            .maybeSingle();
        
        if (customerError) {
            console.error('Error fetching customer:', customerError);
        }

        // 4. Merge data
        return {
            ...transaction,
            spareparts: (spareparts || []).map(sp => ({
              id:sp.id,
              sparepart_name: sp.sparepart_name,
              sparepart_price: sp.sparepart_price,
              sparepart_warranty: sp.warranty_at_transaction,
            })),
            customers_info: customer || null
        } as ServiceTransaction;

    } catch (error) {
        console.error('Error in getInvoiceData:', error);
        return null;
    }
}

export async function updateInvoice(formData: FormData) {
  const supabase = await createClient();
  const globalSchema = 'glory';

  try {
    const invoiceId = formData.get('invoice_id') as string;

    // ==========================================
    // STEP 0: Ambil UUID Transaction dulu!
    // ==========================================
    // Kita butuh UUID dari table header karena junction table nge-refer ke UUID, bukan String Invoice ID
    const { data: transactionRef, error: refError } = await supabase
      .schema(globalSchema)
      .from('services_transactions')
      .select('id')
      .eq('invoice_id', invoiceId)
      .single();

    if (refError || !transactionRef) {
      throw new Error('Transaksi tidak ditemukan. Pastikan Invoice ID benar.');
    }

    const transactionUUID = transactionRef.id;

    // ==========================================
    // STEP 1: Parse Data Header
    // ==========================================
    const transactionData = {
      customer_id: formData.get('customer_id') as string,
      recipient_name: formData.get('recipient_name') as string,
      entry_datetime: formData.get('entry_datetime') as string,
      complaint: formData.get('complaint') as string,
      treatment: (formData.get('treatment') as string) || null,
      phisical_condition: (formData.get('phisical_condition') as string) || null,
      technician: formData.get('technician') as string,
      technicial_fee: formData.get('technicial_fee') ? Number(formData.get('technicial_fee')) : null,
      phone_brand: formData.get('phone_brand') as string,
      phone_imei: (formData.get('phone_imei') as string) || null,
      initial_price: Number(formData.get('initial_price')),
      final_price: Number(formData.get('final_price')),
      location: formData.get('location') as string,
      status: formData.get('status'),
      pickedup_at: (formData.get('pickedup_at') as string)?.trim() === '' ? null : (formData.get('pickedup_at') as string),
    };

    // Parse JSON Spareparts dari Frontend
    const sparepartsJson = formData.get('spareparts') as string;
    const spareparts: SparepartPayload[] = sparepartsJson ? JSON.parse(sparepartsJson) : [];

    // ==========================================
    // STEP 2: Update Header Transaksi
    // ==========================================
    const { error: transactionError } = await supabase
      .schema(globalSchema)
      .from('services_transactions')
      .update(transactionData)
      .eq('invoice_id', invoiceId); // Header tetep pake invoice_id string gpp

    if (transactionError) {
      throw new Error('Gagal update transaksi: ' + transactionError.message);
    }

    // ==========================================
    // STEP 3: Handle Junction Spareparts (The Magic)
    // ==========================================

    // 3a. Ambil semua ID item yang udah ada di DB buat transaksi ini
    const { data: existingItems } = await supabase
      .schema(globalSchema)
      .from('services_sparepart_items') // <-- PAKE TABLE BARU
      .select('id')
      .eq('transaction_id', transactionUUID); // <-- Pake UUID

    const existingIds = existingItems?.map((item) => item.id) || [];
    
    // Filter ID yang valid (UUID string) dari payload. 
    // ID berupa angka (Date.now) dianggap item baru.
    const payloadIds = spareparts
      .filter((sp) => typeof sp.id === 'string' && sp.id.length > 10)
      .map((sp) => sp.id as string);

    // 3b. Delete barang yang dibuang user
    // (Ada di DB, tapi gak ada di Payload user)
    const idsToDelete = existingIds.filter((id) => !payloadIds.includes(id));

    if (idsToDelete.length > 0) {
      await supabase
        .schema(globalSchema)
        .from('services_sparepart_items')
        .delete()
        .in('id', idsToDelete);
    }

    // 3c. Upsert (Insert Baru / Update Lama)
    if (spareparts.length > 0) {
      const itemsToUpsert = spareparts.map((sp) => ({
        // LOGIC KUNCI: 
        // Kalo ID-nya angka (Date.now dari frontend), kita set undefined biar Supabase bikin UUID baru.
        // Kalo ID-nya string UUID, kita pake itu biar ke-update datanya.
        //id: typeof sp.id === 'string' && sp.id.length > 10 ? sp.id : undefined,
        
        transaction_id: transactionUUID, // Foreign Key ke Header
        sparepart_id: sp.sparepart_id,   // Foreign Key ke Master Sparepart
        
        // Snapshot Data (Penting buat history harga)
        price_at_transaction: sp.sparepart_price,
        
        // Data tambahan kalo lu mau simpen varian/garansi di junction
        // (Pastikan kolomnya ada di table service_sparepart_items lu)
        // Jika tidak ada kolomnya di DB, hapus baris di bawah ini:
        // variant: sp.sparepart_variant, 
        warranty_at_transaction: sp.sparepart_warranty 
      }));
      
      const { error: upsertError } = await supabase
        .schema(globalSchema)
        .from('services_sparepart_items')
        .upsert(itemsToUpsert, { onConflict: 'id' });

      if (upsertError) {
        throw new Error('Gagal update spareparts: ' + upsertError.message);
      }
    }

    // ==========================================
    // STEP 4: Revalidate & Return
    // ==========================================
    revalidatePath(`/update/${invoiceId}`);
    revalidatePath('/fl/dashboard/service/daily');

    return { success: true, message: 'Invoice berhasil diupdate dengan sistem baru!' };

  } catch (error) {
    console.error('Error updating invoice:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Terjadi kesalahan sistem',
    };
  }
}

export async function deleteSparepart(junctionId: number) {
    const supabase = await createClient();
    const globalSchema = 'glory';
    
    try {
        const { error } = await supabase
            .schema(globalSchema)
            .from('services_sparepart_items')
            .delete()
            .eq('id', junctionId);

        if (error) {
            console.error('Error deleting sparepart:', error);
            return { success: false, message: 'Gagal menghapus sparepart: ' + error.message };
        }
        
        return { success: true, message: 'Sparepart berhasil dihapus' };
        
    } catch (error) {
        console.error('Error deleting sparepart:', error);
        return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Gagal menghapus sparepart' 
        };
    }
}