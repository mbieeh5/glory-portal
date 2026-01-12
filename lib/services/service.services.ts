import { ServiceTransaction, Sparepart } from "@/config/type";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
)

interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string; // Global search: invoice_id, customer_name, phone_brand, technician, imei, sparepart
    month?: number; // 1-12
    year?: number; // e.g., 2024, 2025
    status?: 'in_process' | 'completed' | 'canceled' | 'picked_up' | 'all';
}

interface PaginatedResponse {
    data: ServiceTransaction[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalRecords: number;
        limit: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    }
}

export async function getMasterDataServices(params: PaginationParams = {}): Promise<PaginatedResponse> {
    const page = params.page || 1;
    const limit = params.limit || 30;
    const offset = (page - 1) * limit;

    // Build query untuk transactions dengan filters
    let transactionQuery = supabase
        .schema('glory')
        .from('services_transactions')
        .select('*', { count: 'exact' });

    // Apply date filters
    if (params.month && params.month !== 0) {
        // Filter by month - extract month dari timestamp
        const startDate = new Date(params.year || new Date().getFullYear(), params.month - 1, 1);
        const endDate = new Date(params.year || new Date().getFullYear(), params.month, 0, 23, 59, 59);
        transactionQuery = transactionQuery
            .gte('entry_datetime', startDate.toISOString())
            .lte('entry_datetime', endDate.toISOString());
    } else if (params.year && params.year !== 0) {
        // Filter by year aja
        const startDate = new Date(params.year, 0, 1);
        const endDate = new Date(params.year, 11, 31, 23, 59, 59);
        transactionQuery = transactionQuery
            .gte('entry_datetime', startDate.toISOString())
            .lte('entry_datetime', endDate.toISOString());
    }

    // Apply status filter
    if (params.status && params.status !== 'all') {
        transactionQuery = transactionQuery.eq('status', params.status);
    }

    // Global search - search di multiple columns
    if (params.search && params.search.trim() !== '') {
        const searchTerm = params.search.trim();
        transactionQuery = transactionQuery.or(
            `invoice_id.ilike.%${searchTerm}%,` +
            `customer_name.ilike.%${searchTerm}%,` +
            `phone_brand.ilike.%${searchTerm}%,` +
            `technician.ilike.%${searchTerm}%,` +
            `imei.ilike.%${searchTerm}%`
        );
    }

    // Get total count dengan filters
    const { count: totalCount, error: countError } = await transactionQuery;

    if (countError) {
        console.error("Error fetching count:", countError);
        return {
            data: [],
            pagination: {
                currentPage: page,
                totalPages: 0,
                totalRecords: 0,
                limit,
                hasNextPage: false,
                hasPrevPage: false
            }
        };
    }

    // Fetch transactions dengan pagination
    const { data: transactionData, error: transactionError } = await transactionQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (transactionError || !transactionData) {
        console.error("Error fetching transactions:", transactionError);
        return {
            data: [],
            pagination: {
                currentPage: page,
                totalPages: Math.ceil((totalCount || 0) / limit),
                totalRecords: totalCount || 0,
                limit,
                hasNextPage: false,
                hasPrevPage: page > 1
            }
        };
    }

    // Kalo ada search di sparepart, fetch semua sparepart yang match
    let sparepartMatchedInvoices: string[] = [];
    if (params.search && params.search.trim() !== '') {
        const { data: matchedSpareparts } = await supabase
            .schema('glory')
            .from('services_spareparts')
            .select('invoice_id')
            .ilike('used_part', `%${params.search.trim()}%`);
        
        if (matchedSpareparts) {
            sparepartMatchedInvoices = matchedSpareparts.map(sp => sp.invoice_id);
        }
    }

    // Combine transactions: yang match di transaction fields ATAU yang punya sparepart match
    let filteredTransactionData = transactionData;
    if (sparepartMatchedInvoices.length > 0) {
        // Fetch additional transactions yang match sparepart search
        const { data: additionalTransactions } = await supabase
            .schema('glory')
            .from('services_transactions')
            .select('*')
            .in('invoice_id', sparepartMatchedInvoices)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (additionalTransactions) {
            // Merge dan deduplicate
            const allTransactions = [...transactionData, ...additionalTransactions];
            const uniqueTransactions = Array.from(
                new Map(allTransactions.map(t => [t.invoice_id, t])).values()
            );
            filteredTransactionData = uniqueTransactions.slice(0, limit);
        }
    }

    // Extract invoice_ids dari transactions yang di-fetch
    const invoiceIds = filteredTransactionData.map(t => t.invoice_id);

    // Fetch spareparts untuk invoice_ids yang di-fetch
    const { data: sparepartData, error: sparepartError } = await supabase
        .schema('glory')
        .from('services_spareparts')
        .select('*')
        .in('invoice_id', invoiceIds)
        .order('created_at', { ascending: false });

    // Extract customer_names dari transactions yang di-fetch
    const customerNames = [...new Set(filteredTransactionData.map(t => t.customer_name))];

    // Fetch customers
    const { data: customersData, error: customersError } = await supabase
        .schema('glory')
        .from('services_customers')
        .select('*')
        .in('nama', customerNames)
        .order('created_at', { ascending: false });

    if (sparepartError || customersError) {
        console.error("Error fetching related data:", sparepartError || customersError);
        return {
            data: [],
            pagination: {
                currentPage: page,
                totalPages: Math.ceil((totalCount || 0) / limit),
                totalRecords: totalCount || 0,
                limit,
                hasNextPage: false,
                hasPrevPage: page > 1
            }
        };
    }

    // Merge data
    const mergedData: ServiceTransaction[] = filteredTransactionData.map(transaction => {
        const spareparts: Sparepart[] = sparepartData?.filter(
            part => part.invoice_id === transaction.invoice_id
        ) || [];
        
        const customer = customersData?.find(
            cust => cust.nama === transaction.customer_name
        );

        return {
            ...transaction,
            spareparts,
            customer_name: customer?.nama || transaction.customer_name
        };
    });

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return {
        data: mergedData,
        pagination: {
            currentPage: page,
            totalPages,
            totalRecords: totalCount || 0,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
}

/*
** ========================================== **
** Helper function for fetch
** without pagination (ONLY WHILE YOU NEEDED)
** ========================================== **
export async function getAllMasterDataServices(){
    const { data: transactionData, error: transactionError } = await supabase
        .schema('glory')
        .from('services_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Keep safety limit

    const { data: sparepartData, error: sparepartError } = await supabase
        .schema('glory')
        .from('services_spareparts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // Reasonable limit untuk spareparts

    const { data: customersData, error: customersError } = await supabase
        .schema('glory')
        .from('services_customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500); // Reasonable limit untuk customers

    if (transactionError || sparepartError || customersError) {
        console.error("Error fetching data:", transactionError || sparepartError || customersError);
        return [];
    }

    const mergedData: ServiceTransaction[] = transactionData!.map(transaction => {
        const spareparts: Sparepart[] = sparepartData!.filter(
            part => part.invoice_id === transaction.invoice_id
        );
        
        const customer = customersData!.find(
            cust => cust.nama === transaction.customer_name
        );

        return {
            ...transaction,
            spareparts,
            customer_name: customer?.nama || transaction.customer_name
        };
    });

    return mergedData;
}
*/