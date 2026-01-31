import { createClient } from "../supabase/client";




export default async function CheckDataSatuanService(inv_id: string) {

    const supabase = createClient();

    const {data, error} = await supabase.schema('glory')
     .from('services_transactions')
     .select('*')
     .match({invoice_id: inv_id})
     .single();

    if(error || !data) {
        console.error('error while fetching Data satuan service: ', error)
        return null;
    }
   
    return data;
}