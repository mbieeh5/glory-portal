// --- SERVICES AREA ---
export interface Sparepart {
  id: number;
  invoice_id: string;
  used_part: string;
  part_price: number;
  part_warranty: string | null;
  part_color_varian: string | null;
}

export interface ServicesCustomer {
  id: number;
  customer_id: string;
  nama: string; 
  nomor_hp: string;
  total_service: number;
  latest_service_date: string;
}

export interface ServiceTransaction {
  id: number;
  invoice_id: string;
  customer_name: string;
  recipient: string;
  entry_datetime: string;
  complaint: string;
  treatment: string | null;
  technician: string;
  phone_brand: string;
  imei: string | null;
  initial_price: number;
  final_price: number;
  service_location: string;
  technician_fee: number | null;
  status: 'in_process' | 'completed' | 'canceled' | 'picked_up';
  pickup_datetime: string | null;
  spareparts: Sparepart[];
}

// -- PAGINATION AREA ---
export interface PaginationParams {
  page? : number;
  limit? : number;
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

