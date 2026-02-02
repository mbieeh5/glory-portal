"use server"
import { ServiceTransaction, Sparepart } from '@/config/type';
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
            .from('services_spareparts')
            .select('*')
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
            spareparts: spareparts || [],
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
        
        // 1. Parse transaction data
        const transactionData = {
            customer_id: formData.get('customer_id') as string,
            recipient_name: formData.get('recipient_name') as string,
            entry_datetime: formData.get('entry_datetime') as string,
            complaint: formData.get('complaint') as string,
            treatment: formData.get('treatment') as string || null,
            phisical_condition: formData.get('phisical_condition') as string || null,
            technician: formData.get('technician') as string,
            technicial_fee: formData.get('technicial_fee') ? Number(formData.get('technicial_fee')) : null,
            phone_brand: formData.get('phone_brand') as string,
            phone_imei: formData.get('phone_imei') as string || null,
            initial_price: Number(formData.get('initial_price')),
            final_price: Number(formData.get('final_price')),
            location: formData.get('location') as string,
            status: formData.get('status') as ServiceTransaction['status'],
            pickedup_at: (formData.get('pickedup_at') as string ).trim() === "" ? null : formData.get('pickedup_at') as string,
        };

        const sparepartsJson = formData.get('spareparts') as string;
        const spareparts: Sparepart[] = sparepartsJson ? JSON.parse(sparepartsJson) : [];

        // 2. Update transaction
        const { error: transactionError } = await supabase
            .schema(globalSchema)
            .from('services_transactions')
            .update(transactionData)
            .eq('invoice_id', invoiceId);
        
        if (transactionError) {
            console.error('Error updating transaction:', transactionError);
            return { success: false, message: 'Gagal mengupdate transaksi: ' + transactionError.message };
        }

        // 3. Handle spareparts update
        // 3a. Fetch existing spareparts untuk tahu mana yang harus di-delete
        const { data: existingSpareparts, error: fetchError } = await supabase
            .schema(globalSchema)
            .from('services_spareparts')
            .select('id')
            .eq('invoice_id', invoiceId);
        
        if (fetchError) {
            console.error('Error fetching existing spareparts:', fetchError);
        }

        const existingIds = existingSpareparts?.map(sp => sp.id) || [];
        const newSparepartsIds = spareparts.map(sp => sp.id).filter(id => id); // Filter out undefined/null

        // 3b. Delete spareparts yang tidak ada di form (yang di-remove user)
        const idsToDelete = existingIds.filter(id => !newSparepartsIds.includes(id));
        
        if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .schema(globalSchema)
                .from('services_spareparts')
                .delete()
                .in('id', idsToDelete);
            
            if (deleteError) {
                console.error('Error deleting spareparts:', deleteError);
            }
        }

        // 3c. Upsert spareparts (update existing, insert new)
        if (spareparts.length > 0) {
            const sparepartsToUpsert = spareparts.map(sp => ({
                id: sp.id || undefined, // Jika id kosong/baru, Supabase akan auto-generate
                invoice_id: invoiceId,
                sparepart_name: sp.sparepart_name,
                sparepart_price: sp.sparepart_price,
                sparepart_warranty: sp.sparepart_warranty || null,
                sparepart_variant: sp.sparepart_variant || null,
            }));

            const { error: upsertError } = await supabase
                .schema(globalSchema)
                .from('services_spareparts')
                .upsert(sparepartsToUpsert, {
                    onConflict: 'id', // Jika id sudah ada, update. Jika belum, insert.
                });
            
            if (upsertError) {
                console.error('Error upserting spareparts:', upsertError);
                return { success: false, message: 'Gagal mengupdate spareparts: ' + upsertError.message };
            }
        }

        // 4. Revalidate path
        revalidatePath(`/update/${invoiceId}`);
        revalidatePath('/'); // Jika ada list page
        
        return { success: true, message: 'Invoice berhasil diupdate!' };
        
    } catch (error) {
        console.error('Error updating invoice:', error);
        return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Gagal mengupdate invoice' 
        };
    }
}

export async function deleteSparepart(sparepartId: number) {
    const supabase = await createClient();
    const globalSchema = 'glory';
    
    try {
        const { error } = await supabase
            .schema(globalSchema)
            .from('services_spareparts')
            .delete()
            .eq('id', sparepartId);
        
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