// GLOBAL AREA //
export interface ActivityLog {
  id: number, // key react
  user: string | null,
  action: string,
  time: string,
  rawTime: string
}

export interface UserProfile {
  id: number,
  full_name: string,
  role: string,
  point: number,
}

export interface RechartsTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}


// --- SERVICES AREA ---
export interface Sparepart {
  id: number;
  invoice_id: string;
  sparepart_name: string;
  sparepart_id?: number;
  sparepart_price: number;
  sparepart_warranty: string | null;
  sparepart_variant: string | null;
}

export type SparepartPayload = {
  id?: string | number,
  sparepart_id : string, 
  sparepart_name: string,
  sparepart_price: number, 
  sparepart_warranty?: string,
}

export interface ServicesCustomer {
  id?: number;
  customer_id: string;
  customer_name: string; 
  customer_phone_number: string;
  total_service?: number;
  latest_service_date?: string;
}

export interface ServiceTransaction {
  id: number;
  invoice_id: string;
  customer_id: string;
  customers_info?: ServicesCustomer | null;
  recipient_name: string;
  entry_datetime: string;
  complaint: string;
  treatment: string | null;
  phisical_condition: string | null;
  technician: string;
  technicial_fee: number | null;
  phone_brand: string;
  phone_imei: string | null;
  initial_price: number;
  final_price: number;
  location: string;
  status: 'in_process' | 'completed' | 'canceled';
  pickedup_at: string | null;
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

export type SparepartItems = NonNullable<ServiceTransaction['spareparts']>[number];



// BANKIR AREA //

// Enums
export enum StatusBankEnum {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed'
}

export enum TransactionType {
  IN = 'IN',  // Transfer masuk
  OUT = 'OUT' // Transfer keluar
}


// Interface untuk Bank Config
export interface BankConfig {
  id: string; // uuid
  tenant_id?: string; // uuid, optional karena ada default
  bank_name: string;
  account_name: string;
  account_number?: string;
  current_balance?: number; // decimal(15, 2)
  is_free?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Interface untuk Bank Customers
export interface BankCustomer {
  customer_id: number; // bigserial
  tenant_id?: string; // uuid, optional karena ada default
  customer_name: string;
  customer_bank_account: string;
  customer_bank_name: string;
  updated_at: Date;
  created_at: Date;
}

// Interface untuk Bank Transactions
export interface BankTransaction {
  id: number; // bigserial
  owner_id?: string; // uuid, optional karena ada default
  transfer_id: string;
  transfer_info?: BankCustomer;
  config_info?: BankConfig;
  entry_datetime: Date;
  customer_id: number | null; // bisa null karena references
  bank_id: string | null; // uuid, bisa null karena references
  type_transactions: string; // char(3) - bisa pake TransactionType enum
  amount: number; // decimal(12, 2)
  admin_fee: number; // decimal(12, 2)
  balance_before: number | null; // decimal(15, 2)
  balance_after: number | null; // decimal(15, 2)
  description: string | null;
  status: StatusBankEnum;
  is_check: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface untuk Insert/Create (tanpa auto-generated fields)
export interface BankConfigInsert {
  id: string;
  tenant_id?: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  current_balance?: number;
  is_free?: boolean;
  is_active?: boolean;
}

export interface BankCustomerInsert {
  tenant_id?: string;
  customer_name: string;
  customer_bank_account: string;
  customer_bank_name: string;
}

export interface BankTransactionInsert {
  owner_id?: string;
  transfer_id: string;
  entry_datetime?: Date;
  customer_id?: number;
  bank_id?: string;
  type_transactions: string;
  amount: number;
  admin_fee?: number;
  balance_before?: number;
  balance_after?: number;
  description?: string;
  status?: StatusBankEnum;
  is_check?: boolean;
}