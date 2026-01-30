'use server';

import { ServiceTransaction } from '@/config/type';
import { revalidatePath } from 'next/cache';

export async function getInvoiceData(invoiceId: string): Promise<ServiceTransaction | null> {
    try {
        // TODO: Implement RLS query
        // const { data, error } = await supabase
        //     .from('service_transactions')
        //     .select(`
        //         *,
        //         spareparts (*)
        //     `)
        //     .eq('invoice_id', invoiceId)
        //     .single();
        
        // Mock data untuk development
        return {
            id: 1,
            invoice_id: invoiceId,
            customer_id: 'CUST-001',
            recipient_name: 'John Doe',
            entry_datetime: '2024-01-28T10:00',
            complaint: 'LCD pecah',
            treatment: 'Ganti LCD',
            phisical_condition: 'Body bagus, LCD pecah',
            technician: 'ibnu',
            technician_fee: 50000,
            phone_brand: 'Samsung Galaxy S21',
            phone_imei: '123456789012345',
            initial_price: 500000,
            final_price: 500000,
            location: 'Jakarta',
            status: 'in_process',
            pickuped_datetime: null,
            spareparts: [
                {
                    id: 1,
                    invoice_id: invoiceId,
                    sparepart_name: 'LCD Samsung S21',
                    sparepart_price: 450000,
                    sparepart_warranty: '30-Hari',
                    sparepert_variant: 'Original',
                }
            ],
        };
    } catch (error) {
        console.error('Error fetching invoice:', error);
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

        // Parse spareparts JSON
        const sparepartsJson = formData.get('spareparts') as string;
        const spareparts = sparepartsJson ? JSON.parse(sparepartsJson) : [];

        // TODO: Implement RLS update
        // const { error } = await supabase
        //     .from('service_transactions')
        //     .update(data)
        //     .eq('invoice_id', invoiceId);
        
        // TODO: Handle spareparts update/insert/delete
        
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
        // TODO: Implement RLS delete
        // const { error } = await supabase
        //     .from('spareparts')
        //     .delete()
        //     .eq('id', sparepartId);
        
        console.log('Deleting sparepart:', sparepartId);
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting sparepart:', error);
        return { success: false, message: 'Gagal menghapus sparepart' };
    }
}