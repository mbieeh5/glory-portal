// --- SERVICES AREA ---
export interface Sparepart {
  id: number;
  invoice_id: string;
  sparepart_name: string;
  sparepart_price: number;
  sparepart_warranty: string | null;
  sparepert_variant: string | null;
}

export interface ServicesCustomer {
  id: number;
  customer_id: string;
  customer_name: string; 
  customer_phone_number: string;
  total_service: number;
  latest_service_date: string;
}

export interface ServiceTransaction {
  id: number;
  invoice_id: string;
  customer_id: string;
  recipient_name: string;
  entry_datetime: string;
  complaint: string;
  treatment: string | null;
  phisical_condition: string | null;
  technician: string;
  technician_fee: number | null;
  phone_brand: string;
  phone_imei: string | null;
  initial_price: number;
  final_price: number;
  location: string;
  status: 'in_process' | 'completed' | 'canceled' | 'picked_up';
  pickuped_datetime: string | null;
  spareparts?: Sparepart[];
}

// -- PAGINATION AREA ---
export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string; // Global search: invoice_id, customer_name, phone_brand, technician, imei, sparepart
    month?: number; // 1-12
    year?: number; // e.g., 2024, 2025
    status?: 'in_process' | 'completed' | 'canceled' | 'picked_up' | 'all';
}

export interface PaginatedResponse {
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