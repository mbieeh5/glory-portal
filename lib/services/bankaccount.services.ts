import { createClient } from "../supabase/client";




export default async function getBankAccounts() {
    const supabase = createClient();

    const {data: dataBank, error: errorDataBank} = await supabase.schema('glory')
    .from('bank_config')
    .select('id, bank_name, account_name, account_number, current_balance')

    if(errorDataBank){
        console.error('Error fetching bank account:', errorDataBank);
        return null;
    }

    return dataBank
}