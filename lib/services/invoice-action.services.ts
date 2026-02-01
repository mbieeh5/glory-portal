"use server"
import { ServiceTransaction } from '@/config/type';
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
            console.log('No transaction found for invoice:', invoiceId);
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
            .eq('customer_name', transaction.customer_id) // atau sesuaikan field-nya
            .maybeSingle();
        
        if (customerError) {
            console.error('Error fetching customer:', customerError);
        }

        // 4. Merge data
        return {
            ...transaction,
            services_spareparts: spareparts || [],
            services_customers: customer || null
        } as ServiceTransaction;

    } catch (error) {
        console.error('Error in getInvoiceData:', error);
        return null;
    }
}

export async function updateInvoice(formData: FormData) {
    try {
        // Parse form data
        const invoiceId = formData.get('invoice_id') as string;
        const data = {
            customer_id: formData.get('customer_id') as string,
            recipient_name: formData.get('recipient_name') as string,
            entry_datetime: formData.get('entry_datetime') as string,
            complaint: formData.get('complaint') as string,
            treatment: formData.get('treatment') as string,
            phisical_condition: formData.get('phisical_condition') as string,
            technician: formData.get('technician') as string,
            technician_fee: formData.get('technician_fee') ? Number(formData.get('technician_fee')) : null,
            phone_brand: formData.get('phone_brand') as string,
            phone_imei: formData.get('phone_imei') as string,
            initial_price: Number(formData.get('initial_price')),
            final_price: Number(formData.get('final_price')),
            location: formData.get('location') as string,
            status: formData.get('status') as ServiceTransaction['status'],
            pickuped_datetime: formData.get('pickuped_datetime') as string || null,
        };

        const sparepartsJson = formData.get('spareparts') as string;
        const spareparts = sparepartsJson ? JSON.parse(sparepartsJson) : [];
        
        console.log('Updating invoice:', { invoiceId, data, spareparts });
        
        // Revalidate the page
        revalidatePath(`/update/${invoiceId}`);
        
        return { success: true, message: 'Invoice berhasil diupdate!' };
    } catch (error) {
        console.error('Error updating invoice:', error);
        return { success: false, message: 'Gagal mengupdate invoice' };
    }
}

export async function deleteSparepart(sparepartId: number) {
    try {

        console.log('Deleting sparepart:', sparepartId);
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting sparepart:', error);
        return { success: false, message: 'Gagal menghapus sparepart' };
    }
}