
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
