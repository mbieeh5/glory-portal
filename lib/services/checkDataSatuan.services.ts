import { ServiceTransaction } from "@/config/type";
import { createClient } from "../supabase/client";




export default async function CheckDataSatuanService(inv_id: string) {

    const supabase = createClient();

    const {data: TransactionData, error: TransactionsError} = await supabase.schema('glory')
     .from('services_transactions')
     .select('*')
     .match({invoice_id: inv_id})
     .single();

    if(TransactionsError || !TransactionData) {
        console.error('error while fetching Data satuan service: ', TransactionsError)
        return null;
    }

    const {data: customersInfo, error : customerError} = await supabase.schema('glory')
    .from('services_customers')
    .select('customer_name, customer_phone_number')
    .match({customer_id: TransactionData.customer_id})
    .single();

    if(customerError) {
        console.error('error while fetching customer information: ', customerError);
    };

    const mergedData: ServiceTransaction = {
        ...TransactionData,
        customers_info: customersInfo || null
    }

    return mergedData
}