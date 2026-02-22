'use server';

import { createClient } from "../supabase/server";





export default async function searchSpareparts(query:string) {
    const supabase = await createClient();
    
    if(!query || query.length < 2) return [];

    const { data, error } = await supabase.schema('glory')
    .from('services_parent_sparepart')
    .select('*')
    .ilike(`sparepart_name`, `%${query}%`)
    .range(0, 5)

    console.log(error);
    if(error) return []
    
    return data.map(item => ({
        ...item,
        sparepart_name: item.sparepart_name.length > 60 ? 
        item.sparepart_name.substring(0, 57) + '...'
        : item.sparepart_name
    }))
}