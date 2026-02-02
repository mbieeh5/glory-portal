
DECLARE
  matched_customer_id bigint;
  matched_customer_phone text;
  norm_tx_phone text;
  norm_tx_name text;
BEGIN
  -- Only act when NEW.status = 'success'
  IF TG_OP = 'INSERT' AND NEW.status = 'success' THEN
    -- proceed
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only act when it becomes success now (avoid double counting)
    IF NOT (NEW.status = 'success' AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Normalize phone and name for matching
  norm_tx_phone := regexp_replace(COALESCE(NEW.nomor_hp, ''), '\D', '', 'g');
  norm_tx_name := lower(trim(coalesce(NEW.customer_name, NEW.nama, '')));

  -- Try phone match first when present
  IF norm_tx_phone <> '' THEN
    SELECT id, nomor_hp INTO matched_customer_id, matched_customer_phone
    FROM glory.services_customers
    WHERE regexp_replace(coalesce(nomor_hp, ''), '\D', '', 'g') = norm_tx_phone
    LIMIT 1;
  END IF;

  -- Fallback to name match if no phone match
  IF matched_customer_id IS NULL AND norm_tx_name <> '' THEN
    SELECT id, nomor_hp INTO matched_customer_id, matched_customer_phone
    FROM glory.services_customers
    WHERE lower(trim(coalesce(nama, ''))) = norm_tx_name
    LIMIT 1;
  END IF;

  IF matched_customer_id IS NOT NULL THEN
    -- Atomically update last_service_date and increment total_services
    UPDATE glory.services_customers
    SET
      last_service_date = GREATEST(COALESCE(last_service_date, timestamp 'epoch'), COALESCE(NEW.entry_datetime, now())),
      total_services = COALESCE(total_services, 0) + 1,
      updated_at = now()
    WHERE id = matched_customer_id;

    -- If transaction has no phone, copy it from customer
    IF (NEW.nomor_hp IS NULL OR trim(NEW.nomor_hp) = '') AND matched_customer_phone IS NOT NULL THEN
      UPDATE glory.services_transactions
      SET nomor_hp = matched_customer_phone, updated_at = now()
      WHERE id = NEW.id;
    END IF;
  ELSE
    -- No match found: do nothing (no auto-create)
    NULL;
  END IF;

  RETURN NEW;
END;














---------------------------------
-- ====== NEW DB SCHEMA ====== --
---------------------------------
CREATE SCHEMA IF NOT EXISTS glory;

-- Enum Status
DO $$ BEGIN
    CREATE TYPE status_enum AS ENUM ('in_process', 'completed', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Table Customers (Master Data - Harus Berdiri Duluan)
CREATE TABLE IF NOT EXISTS glory.services_customers (
    id BIGSERIAL PRIMARY KEY, 
    tenant_id uuid default auth.uid(),
    customer_id varchar(20) UNIQUE NOT NULL, -- Generate dari FE, harus Unique buat di-reference
    customer_name varchar(255) NOT NULL,
    customer_phone_number varchar(20),
    customer_total_services integer DEFAULT 0,
    customer_last_service_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT current_timestamp,
    updated_at timestamp with time zone DEFAULT current_timestamp
);

-- 2. Table Transaction (The "Ketua" / Parent of Spareparts)
CREATE TABLE IF NOT EXISTS glory.services_transactions (
    id BIGSERIAL PRIMARY KEY,
    owner_id uuid default auth.uid(), 
    invoice_id varchar(50) UNIQUE NOT NULL, -- Ikatan Cinta ke Customer
    customer_id varchar(20) NOT NULL REFERENCES glory.services_customers(customer_id) ON DELETE CASCADE,
    recipient_name varchar(255) NOT NULL,
    entry_datetime timestamp with time zone NOT NULL,
    complaint text NOT NULL,
    phisical_condition text NOT NULL,
    treatment text,
    technician varchar(100),
    technicial_fee decimal(12,2),
    phone_brand varchar(100) NOT NULL,
    phone_imei varchar(20),
    initial_price decimal(12,2) NOT NULL,
    final_price decimal(12, 2),
    status status_enum NOT NULL DEFAULT 'in_process',
    pickedup_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT current_timestamp,
    updated_at timestamp with time zone DEFAULT current_timestamp
);

-- 3. Table Spareparts (Anak dari Transaction)
CREATE TABLE IF NOT EXISTS glory.services_spareparts (
  id BIGSERIAL PRIMARY KEY,
  tenant_id uuid default auth.uid(),
  invoice_id varchar(50) NOT NULL REFERENCES glory.services_transactions(invoice_id) ON DELETE CASCADE,
  sparepart_name varchar(255) NOT NULL,
  sparepart_price decimal(12,2) NOT NULL, 
  sparepart_warranty varchar(20),
  sparepart_variant varchar(50), 
  created_at timestamp with time zone DEFAULT current_timestamp,
  updated_at timestamp with time zone DEFAULT current_timestamp
);

--- DKI Daerah Kekuasaan Index ---
CREATE INDEX idx_services_transactions_invoice_id ON glory.services_transactions(invoice_id);
CREATE INDEX idx_services_transactions_customer_id ON glory.services_transactions(customer_id);
CREATE INDEX idx_services_transactions_recipient_name ON glory.services_transactions(recipient_name);
CREATE INDEX idx_services_transactions_technician ON glory.services_transactions(technician);
CREATE INDEX idx_services_transactions_phone_brand ON glory.services_transactions(phone_brand);
CREATE INDEX idx_services_transactions_phone_imei ON glory.services_transactions(phone_imei);
CREATE INDEX idx_services_transactions_status ON glory.services_transactions(status);
CREATE INDEX idx_services_transactions_pickedup_at ON glory.services_transactions(pickedup_at);
CREATE INDEX idx_services_transactions_entry_datetime ON glory.services_transactions(entry_datetime);

CREATE INDEX idx_services_spareparts_invoice_id ON glory.services_spareparts(invoice_id);
CREATE INDEX idx_services_spareparts_sparepart_name ON glory.services_spareparts(sparepart_name);

CREATE INDEX idx_services_customers_customer_id ON glory.services_customers(customer_id);
CREATE INDEX idx_services_customers_customer_name ON glory.services_customers(customer_name);
CREATE INDEX idx_services_customers_phone_number ON glory.services_customers(customer_phone_number); -- Fix Column Name

CREATE INDEX idx_customers_tenant ON glory.services_customers(tenant_id);
CREATE INDEX idx_transactions_owner ON glory.services_transactions(owner_id);
CREATE INDEX idx_spareparts_tenant ON glory.services_spareparts(tenant_id);

--- DKT Daerah Kekuasaan Trigger ---
CREATE OR REPLACE FUNCTION glory.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = current_timestamp; -- Fix typo update_at -> updated_at
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

--- Apply Trigger ---
CREATE TRIGGER trg_update_services_transactions BEFORE UPDATE ON glory.services_transactions FOR EACH ROW EXECUTE FUNCTION glory.update_updated_at_column();
CREATE TRIGGER trg_update_services_spareparts BEFORE UPDATE ON glory.services_spareparts FOR EACH ROW EXECUTE FUNCTION glory.update_updated_at_column();
CREATE TRIGGER trg_update_services_customers BEFORE UPDATE ON glory.services_customers FOR EACH ROW EXECUTE FUNCTION glory.update_updated_at_column();



--- Satpam Khusus ---

-- get Auth Tenant function.
-- # schema glory
-- name of function get_auth_tenant
-- return type uuid 
-- SELECT (auth.jwt() ->> 'tenant_id')::uuid;

-- get Auth
-- # shcmea glory
-- name of function get_auth_uid
-- return type uuid
-- SELECT auth.uid(); 

-- setOwnerId
-- schema glory
-- name of function set_owner_id_before_insert
-- return type trigger
-- BEGIN IF NEW.owner_id IS NULL THEN NEW.owner_id := get_auth_uid(); END IF; RETURN NEW; END; 

alter policy "owner can insert"



-- Create SELECT RLS policies with corrected column references

ALTER TABLE IF EXISTS "glory"."services_transactions" ENABLE ROW LEVEL SECURITY;

-- Admin
DROP POLICY IF EXISTS "glory_services_transactions_select_admin" ON "glory"."services_transactions";
CREATE POLICY "glory_services_transactions_select_admin"
  ON "glory"."services_transactions"
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Moderator
DROP POLICY IF EXISTS "glory_services_transactions_select_moderator" ON "glory"."services_transactions";
CREATE POLICY "glory_services_transactions_select_moderator"
  ON "glory"."services_transactions"
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'moderator'
    AND date_trunc('second', COALESCE(entry_datetime, 'epoch'::timestamptz)) = date_trunc('second', now())
    AND date_trunc('second', COALESCE(updated_at, 'epoch'::timestamptz)) = date_trunc('second', now())
  );

-- Frontliner (owner_id present on services_transactions)
DROP POLICY IF EXISTS "glory_services_transactions_select_frontliner" ON "glory"."services_transactions";
CREATE POLICY "glory_services_transactions_select_frontliner"
  ON "glory"."services_transactions"
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'frontliner'
    AND ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = owner_id)
  );

--------------------------------------------------------------------------------
ALTER TABLE IF EXISTS "glory"."services_spareparts" ENABLE ROW LEVEL SECURITY;

-- Admin
DROP POLICY IF EXISTS "glory_services_spareparts_select_admin" ON "glory"."services_spareparts";
CREATE POLICY "glory_services_spareparts_select_admin"
  ON "glory"."services_spareparts"
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Frontliner & Moderator (tenant_id present on services_spareparts)
DROP POLICY IF EXISTS "glory_services_spareparts_select_frontliner" ON "glory"."services_spareparts";
CREATE POLICY "glory_services_spareparts_select_frontliner"
  ON "glory"."services_spareparts"
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'frontliner' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'moderator'
    AND ((auth.jwt() ->> 'tenant_id') IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );

--------------------------------------------------------------------------------
ALTER TABLE IF EXISTS "glory"."services_customers" ENABLE ROW LEVEL SECURITY;

-- Admin
DROP POLICY IF EXISTS "glory_services_customers_select_admin" ON "glory"."services_customers";
CREATE POLICY "glory_services_customers_select_admin"
  ON "glory"."services_customers"
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Frontliner & Moderator (tenant_id present on services_customers)
DROP POLICY IF EXISTS "glory_services_customers_select_frontliner" ON "glory"."services_customers";
CREATE POLICY "glory_services_customers_select_frontliner"
  ON "glory"."services_customers"
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'frontliner' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'moderator'
    AND ((auth.jwt() ->> 'tenant_id') IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );



---------------------------------
--====== NEW BANK SCHEMA ======--
---------------------------------
-- Enum Status
DO $$ BEGIN
    CREATE TYPE status_bank_enum AS ENUM ('completed', 'canceled', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Table bank Config
CREATE TABLE IF NOT EXISTS glory.bank_config (
    id uuid PRIMARY KEY, 
    tenant_id uuid default auth.uid(),
    bank_name varchar(30) not null,
    account_name varchar(100) not null,
    account_number varchar(30) not null,
    current_balance decimal(15, 2) default 0,
    is_free boolean default false,
    is_active boolean default true,
    created_at timestamp with time zone default current_timestamp,
    updated_at timestamp with time zone default current_timestamp
);

-- 2. Table Bank Customers
CREATE TABLE IF NOT EXISTS glory.bank_customers (
    customer_id bigserial primary key,
    tenant_id uuid default auth.uid(),
    customer_name varchar(100) not null,
    customer_bank_account varchar(30) unique not null,
    customer_bank_name varchar(30) not null,
    updated_at timestamp with time zone default current_timestamp,
    created_at timestamp with time zone DEFAULT current_timestamp
);

-- 3. Table Bank Transactions
CREATE TABLE IF NOT EXISTS glory.bank_transactions (
  id BIGSERIAL PRIMARY KEY,
  owner_id uuid default auth.uid(),
  transfer_id varchar(50) unique not null,
  entry_datetime timestamp with time zone default current_timestamp,
  customer_id int8 references glory.bank_customers(customer_id),
  bank_id uuid references glory.bank_config(id),
  type_transactions char(3) not null,
  amount decimal(12, 2) not null,
  admin_fee decimal(12, 2) null default 0,
  balance_before decimal(15, 2),
  balance_after decimal(15, 2), 
  description varchar(50), 
  status status_bank_enum not null default 'completed',
  is_check boolean default false,
  created_at timestamp with time zone DEFAULT current_timestamp,
  updated_at timestamp with time zone DEFAULT current_timestamp
);

--- DKI Daerah Kekuasaan Index (Optimized) ---
-- Tabel Transactions
CREATE INDEX idx_bank_trans_cust_id ON glory.bank_transactions(customer_id);
CREATE INDEX idx_bank_trans_transfer_id ON glory.bank_transactions(transfer_id);
CREATE INDEX idx_bank_trans_owner_id ON glory.bank_transactions(owner_id);
CREATE INDEX idx_bank_trans_is_check ON glory.bank_transactions(is_check);
CREATE INDEX idx_bank_trans_bank_id ON glory.bank_transactions(bank_id);
CREATE INDEX idx_bank_trans_status ON glory.bank_transactions(status);
CREATE INDEX idx_bank_trans_entry_date ON glory.bank_transactions(entry_datetime);

-- Tabel Customers & Config (Biar RLS kenceng)
CREATE INDEX idx_bank_cust_tenant_id ON glory.bank_customers(tenant_id);
CREATE INDEX idx_bank_config_tenant_id ON glory.bank_config(tenant_id);

--- DKT Daerah Kekuasaan Trigger ---
CREATE TRIGGER trg_update_bank_transactions BEFORE UPDATE ON glory.bank_transactions FOR EACH ROW EXECUTE FUNCTION glory.update_updated_at_column();
CREATE TRIGGER trg_update_bank_customers BEFORE UPDATE ON glory.bank_customers FOR EACH ROW EXECUTE FUNCTION glory.update_updated_at_column();
CREATE TRIGGER trg_update_bank_config BEFORE UPDATE ON glory.bank_config FOR EACH ROW EXECUTE FUNCTION glory.update_updated_at_column();

--- TFS Trigger Function Special ---

-- BEFORE INSERT TRIGGER ONLY!!!! --
CREATE OR REPLACE FUNCTION glory.fn_process_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_bank_asal_name varchar;
    v_cust_bank_name varchar;
    v_current_bal decimal(15,2);
    v_is_free_bank boolean;
    v_usage_count int;
    v_admin_fee decimal(12,2) := 0;
BEGIN
    -- 1. Ambil info Bank Asal, Saldo, & Status Gratisnya dari Config
    -- Pake FOR UPDATE biar gak bentrok kalo ada transaksi barengan (Race Condition)
    SELECT bank_name, current_balance, is_free 
    INTO v_bank_asal_name, v_current_bal, v_is_free_bank
    FROM glory.bank_config WHERE id = NEW.bank_id FOR UPDATE;

    -- 2. Ambil Nama Bank Tujuan dari Master Customer
    SELECT customer_bank_name INTO v_cust_bank_name 
    FROM glory.bank_customers WHERE customer_id = NEW.customer_id;

    -- 3. LOGIC ITUNG ADMIN FEE
    
    -- A. Kalo Nama Bank Persis Sama (Ex: BCA ke BCA) -> FREE
    IF v_bank_asal_name = v_cust_bank_name THEN
        v_admin_fee := 0;

    -- B. Kalo Beda Bank tapi Bank Asal punya fitur is_free (Danamon/Danamon_QR)
    ELSIF v_is_free_bank = true THEN
        -- Itung pemakaian bulan ini (Reset otomatis tiap tgl 1)
        SELECT count(*) INTO v_usage_count 
        FROM glory.bank_transactions 
        WHERE bank_id = NEW.bank_id 
          AND type_transactions = 'OUT'
          AND status = 'completed'
          AND entry_datetime >= date_trunc('month', current_timestamp);

        -- Cek Jatah 100x (Biar countdown lu jalan)
        IF v_usage_count < 100 THEN
            v_admin_fee := 0;
        ELSE
            v_admin_fee := 2500; -- Jatah abis, kena tarif normal
        END IF;

    -- C. Beda Bank & Gak Ada Jatah Gratis (Ex: BRI ke BCA) -> 2500
    ELSE
        v_admin_fee := 2500;
    END IF;

    -- 4. ISI DATA KE ROW TRANSAKSI
    NEW.admin_fee := v_admin_fee;
    NEW.balance_before := v_current_bal;
    
    IF NEW.type_transactions = 'OUT' THEN
        NEW.balance_after := v_current_bal - (NEW.amount + v_admin_fee);
    ELSE
        NEW.balance_after := v_current_bal + NEW.amount;
    END IF;

    -- 5. UPDATE SALDO BRANKAS (bank_config) SECARA OTOMATIS
    UPDATE glory.bank_config 
    SET current_balance = NEW.balance_after, updated_at = now()
    WHERE id = NEW.bank_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;