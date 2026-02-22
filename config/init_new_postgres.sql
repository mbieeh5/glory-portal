
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



CREATE OR REPLACE VIEW glory.v_all_service_spareparts AS
-- 1. Ambil data dari sistem BARU (Junction)
SELECT 
    s.id,
    t.invoice_id, -- Kita join buat dapet string INV-nya
    p.sparepart_name,
    s.price_at_transaction as price,
    s.created_at,
    'new' as source_type -- Biar kita tau ini data baru
FROM glory.services_sparepart_items s
JOIN glory.services_transactions t ON s.transaction_id = t.id
JOIN glory.services_parent_sparepart p ON s.sparepart_id = p.id

UNION ALL

-- 2. Ambil data dari sistem LAMA (Direct Text)
SELECT 
    id,
    invoice_id,
    sparepart_name,
    sparepart_price as price,
    created_at,
    'old' as source_type -- Biar kita tau ini data lama
FROM glory.services_spareparts; -- Table lama lu

CREATE TABLE glory.services_sparepart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Ngiket ke Invoice utama
    transaction_id bigint REFERENCES glory.services_transactions(id) ON DELETE CASCADE,
    
    -- Ngiket ke Master Sparepart
    sparepart_id bigint REFERENCES glory.services_parent_sparepart(id),
    
    -- Snapshot harga pas transaksi (biar history gak berubah kalo master naik)
    price_at_transaction NUMERIC NOT NULL,
    
    -- Usul gua: tambahin qty biar rapi
    -- quantity INT DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexing biar kueri rekap lu jam 10 malem secepat kilat
CREATE INDEX idx_sparepart_items_transaction_id ON glory.services_sparepart_items(transaction_id);

CREATE OR REPLACE VIEW glory.view_bank_analytics AS
SELECT 
    -- Grouping per Tanggal
    t.created_at::DATE as transaction_date,
    
    -- Nama Bank dari tabel config
    c.bank_name,
    
    -- Total Nominal
    SUM(t.amount) as total_amount,
    
    -- Total Transaksi (Frekuensi)
    COUNT(t.id) as total_count

FROM glory.bank_transactions t
JOIN glory.bank_config c ON t.bank_id = c.id -- Sesuaikan FK ini
-- WHERE t.type = 'incoming' -- Opsional: Kalo lu cuma mau liat duit masuk, buka komen ini
GROUP BY 1, 2
ORDER BY 1 ASC;

CREATE OR REPLACE VIEW glory.view_service_analytics AS
SELECT 
    -- Format Bulan (contoh: "2024-02") buat sorting
    TO_CHAR(created_at, 'YYYY-MM') as month_key,
    -- Format Tampilan (contoh: "Feb 2024") buat UI
    TO_CHAR(created_at, 'Mon YYYY') as display_month,
    
    -- 1. Total Berhasil (Completed)
    COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
    
    -- 2. Total Gagal (Canceled)
    COUNT(*) FILTER (WHERE status = 'canceled') as total_canceled,
    
    -- 3. Berhasil tapi Belum Diambil (Barang numpuk di toko)
    COUNT(*) FILTER (WHERE status = 'completed' AND pickedup_at IS NULL) as completed_unpicked,
    
    -- 4. Gagal tapi Belum Diambil (Barang numpuk, user ngilang/batal)
    COUNT(*) FILTER (WHERE status = 'canceled' AND pickedup_at IS NULL) as canceled_unpicked,
    
    -- 5. Masih Pending (Kerjaan teknisi)
    COUNT(*) FILTER (WHERE status = 'in_process') as total_pending,
    
    -- Total Masuk
    COUNT(*) as total_incoming

FROM glory.services_transactions
GROUP BY 1, 2
ORDER BY 1 DESC; -- Bulan terbaru paling atas

CREATE OR REPLACE FUNCTION glory.calculate_legit_points(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (user_id UUID, real_point BIGINT) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        owner_id as user_id,
        -- Kita hitung jumlah baris yang memenuhi syarat, kaliin 5000
        (COUNT(*)::BIGINT * 5000) as real_point
    FROM 
        glory.services_transactions -- Ganti pake nama tabel transaksi lu bos
    WHERE 
        status = 'completed' 
        AND pickedup_at IS NOT NULL
        AND length(COALESCE(phone_imei, '')) > 5
        -- Filter berdasarkan tanggal pickedup_at
        AND pickedup_at::DATE >= p_start_date 
        AND pickedup_at::DATE <= p_end_date
    GROUP BY 
        owner_id;
END;
$$;



-- 1. Hapus dulu yang lama biar gak bentrok
DROP FUNCTION IF EXISTS glory.fn_normalize_bank_name(text);
DROP FUNCTION IF EXISTS glory.fn_normalize_bank_name(varchar);

-- 2. Bikin ulang pake tipe TEXT tapi panggilannya bisa nerima VARCHAR
CREATE OR REPLACE FUNCTION glory.fn_normalize_bank_name(p_bank_name text)
RETURNS text AS $$
DECLARE
    v_input text := UPPER(p_bank_name);
BEGIN
    IF v_input ILIKE '%BCA%' OR v_input ILIKE '%CENTRAL ASIA%' THEN
        RETURN 'BCA';
    ELSIF v_input ILIKE '%BRI%' OR v_input ILIKE '%RAKYAT INDONESIA%' THEN
        RETURN 'BRI';
    ELSIF v_input ILIKE '%BNI%' OR v_input ILIKE '%NEGARA INDONESIA%' THEN
        RETURN 'BNI';
    ELSIF v_input ILIKE '%MANDIRI%' THEN
        RETURN 'MANDIRI';
    ELSIF v_input ILIKE '%DANAMON%' THEN
        RETURN 'DANAMON';
    ELSE
        -- Fallback buat Bank Nagari, Jago, dll
        RETURN 'DANAMON';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION glory.fn_add_internal_balance(
  p_bank_id uuid,
  p_amount decimal,
  p_description text DEFAULT 'Tambah Saldo Manual (Internal)'
)
RETURNS void 
SECURITY DEFINER 
AS $$
DECLARE
  v_bal_before decimal;
  v_batch_id varchar;
BEGIN
  -- 1. Generate ID Transaksi
  v_batch_id := 'TOPUP-INT-' || to_char(now(), 'YYYYMMDDHH24MISS');

  -- 2. Ambil Saldo Sebelum & Lock Row
  SELECT current_balance INTO v_bal_before 
  FROM glory.bank_config 
  WHERE id = p_bank_id 
  FOR UPDATE;

  -- 3. Update Brankas (bank_config)
  UPDATE glory.bank_config 
  SET current_balance = current_balance + p_amount, 
      updated_at = now()
  WHERE id = p_bank_id;

  -- 4. Catat Mutasi Masuk (IN)
  INSERT INTO glory.bank_transactions (
    bank_id,
    type_transactions,
    amount,
    admin_fee,
    balance_before,
    balance_after,
    description,
    transfer_id,
    status,
    customer_id -- Set NULL karena ini bukan transaksi pelanggan
  ) VALUES (
    p_bank_id,
    'IN',
    p_amount,
    0,
    v_bal_before,
    (v_bal_before + p_amount),
    p_description,
    v_batch_id,
    'completed',
    NULL
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION glory.fn_internal_transfer(
  p_from_bank_id uuid,
  p_to_bank_id uuid,
  p_amount decimal,
  p_description text DEFAULT 'Pindah Saldo Internal'
)
RETURNS void 
SECURITY DEFINER 
AS $$
DECLARE
  v_batch_id varchar;
  v_bank_asal_name varchar;
  v_bank_tujuan_name varchar;
  v_bal_before_from decimal;
  v_bal_before_to decimal;
  v_is_free_bank boolean;
  v_usage_count int;
  v_admin_fee decimal(12,2) := 0;
  v_from_code text;
  v_to_code text;
BEGIN
  -- 1. Generate Batch ID
  v_batch_id := 'INT-' || to_char(now(), 'YYYYMMDDHH24MISS');

  -- 2. Lock & Ambil Info (Asal & Tujuan)
  -- Pastiin di bank_config ada kolom is_free buat Danamon
  SELECT bank_name, current_balance, is_free 
  INTO v_bank_asal_name, v_bal_before_from, v_is_free_bank
  FROM glory.bank_config WHERE id = p_from_bank_id FOR UPDATE;
  
  SELECT bank_name, current_balance INTO v_bank_tujuan_name, v_bal_before_to 
  FROM glory.bank_config WHERE id = p_to_bank_id FOR UPDATE;

  -- 3. LOGIC NORMALISASI & ADMIN FEE
  v_from_code := glory.fn_normalize_bank_name(v_bank_asal_name);
  v_to_code := glory.fn_normalize_bank_name(v_bank_tujuan_name);

  IF v_from_code = v_to_code THEN
    v_admin_fee := 0; -- Sesama bank (BCA ke BCA)
  ELSE
    -- Beda Bank! Cek jatah gratis Danamon
    IF v_is_free_bank = TRUE THEN
      SELECT count(*) INTO v_usage_count 
      FROM glory.bank_transactions 
      WHERE bank_id = p_from_bank_id 
        AND type_transactions = 'OUT'
        AND admin_fee = 0 
        AND entry_datetime >= date_trunc('month', now());

      IF v_usage_count < 100 THEN v_admin_fee := 0; ELSE v_admin_fee := 2500; END IF;
    ELSE
      v_admin_fee := 2500; -- Bank pelit (BCA/BRI dll)
    END IF;
  END IF;

  -- 4. Validasi Saldo Asal (Nominal + Admin)
  IF v_bal_before_from < (p_amount + v_admin_fee) THEN
    RAISE EXCEPTION 'Saldo % gak cukup (Butuh: %)! Sisa: %', v_bank_asal_name, (p_amount + v_admin_fee), v_bal_before_from;
  END IF;

  -- 5. UPDATE BRANKAS (bank_config)
  UPDATE glory.bank_config SET current_balance = current_balance - (p_amount + v_admin_fee), updated_at = now() WHERE id = p_from_bank_id;
  UPDATE glory.bank_config SET current_balance = current_balance + p_amount, updated_at = now() WHERE id = p_to_bank_id;

  -- 6. CATAT MUTASI OUT (Bank Asal)
  INSERT INTO glory.bank_transactions (
    bank_id, type_transactions, amount, admin_fee, 
    balance_before, balance_after,
    description, transfer_id, status
  ) VALUES (
    p_from_bank_id, 'OUT', p_amount, v_admin_fee, 
    v_bal_before_from, (v_bal_before_from - (p_amount + v_admin_fee)),
    p_description || ' (Ke ' || v_bank_tujuan_name || ')',
    v_batch_id || '-OUT', 'completed'
  );

  -- 7. CATAT MUTASI IN (Bank Tujuan)
  INSERT INTO glory.bank_transactions (
    bank_id, type_transactions, amount, admin_fee, 
    balance_before, balance_after,
    description, transfer_id, status
  ) VALUES (
    p_to_bank_id, 'IN', p_amount, 0, 
    v_bal_before_to, (v_bal_before_to + p_amount),
    p_description || ' (Dari ' || v_bank_asal_name || ')',
    v_batch_id || '-IN', 'completed'
  );

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION glory.submit_bank_transaction_final(
    p_transfer_id TEXT,
    p_bank_id UUID, -- ID Bank Asal (Dari Config)
    p_amount DECIMAL(12, 2),
    p_type_transactions CHAR(3),
    p_description TEXT,
    p_customer_name TEXT,
    p_customer_bank_account TEXT,
    p_customer_bank_name TEXT -- Bank Tujuan (BCA, BRI, dll)
) RETURNS VOID AS $$
DECLARE
    v_customer_id INT8;
    v_balance_before DECIMAL(15, 2);
    v_balance_after DECIMAL(15, 2);
    
    -- Variable buat logic Admin Fee
    v_bank_asal_name TEXT;
    v_is_free_bank BOOLEAN;
    v_usage_count INT;
    v_admin_fee DECIMAL(12, 2) := 0; -- Default 0
    v_total_deduction DECIMAL(15, 2);
BEGIN
    -- 1. UPSERT CUSTOMER (Simpen Data Penerima)
    INSERT INTO glory.bank_customers (customer_name, customer_bank_account, customer_bank_name, updated_at, created_at)
    VALUES (p_customer_name, p_customer_bank_account, p_customer_bank_name, now(), now())
    ON CONFLICT (customer_bank_account) 
    DO UPDATE SET updated_at = now()
    RETURNING customer_id INTO v_customer_id;

    -- 2. LOCK BANK CONFIG & AMBIL DATA BANK ASAL
    SELECT current_balance, bank_name, is_free 
    INTO v_balance_before, v_bank_asal_name, v_is_free_bank
    FROM glory.bank_config
    WHERE id = p_bank_id
    FOR UPDATE; -- <--- LOCK BIAR AMAN

    -- ==========================================
    -- 3. LOGIC ADMIN FEE (Di sini kita mainkan!)
    -- ==========================================
    
    -- Cek A: Apakah Bank Asal == Bank Tujuan? (Case Insensitive biar aman)
    -- Misal: "Bank BCA" vs "BCA" -> Pake ILIKE atau logic simple
    IF v_bank_asal_name ILIKE '%' || p_customer_bank_name || '%' THEN
        v_admin_fee := 0; -- Sesama bank GRATIS

    -- Cek B: Apakah Bank Asal punya fitur Gratis (Danamon/Taspen)?
    ELSIF v_is_free_bank = TRUE THEN
        -- Hitung transaksi OUT bulan ini yang sukses
        SELECT count(*) INTO v_usage_count 
        FROM glory.bank_transactions 
        WHERE bank_id = p_bank_id 
          AND type_transactions = 'OUT'
          AND status = 'completed' -- Atau 'success' sesuai enum lu
          AND entry_datetime >= date_trunc('month', now());

        -- Logic Kuota 100x
        IF v_usage_count < 100 THEN
            v_admin_fee := 0;
        ELSE
            v_admin_fee := 2500; -- Kuota abis
        END IF;

    -- Cek C: Beda Bank & Gak Gratis
    ELSE
        v_admin_fee := 2500;
    END IF;

    -- ==========================================
    -- 4. VALIDASI & HITUNG SALDO AKHIR
    -- ==========================================
    
    -- Total yang harus dipotong (Transfer + Admin)
    v_total_deduction := p_amount + v_admin_fee;

    -- Validasi Saldo Cukup Gak?
    IF p_type_transactions = 'OUT' AND v_balance_before < v_total_deduction THEN
        RAISE EXCEPTION 'Saldo tidak cukup untuk Transfer + Admin Fee! Butuh: %, Sisa: %', v_total_deduction, v_balance_before;
    END IF;

    -- Hitung Saldo Akhir
    IF p_type_transactions = 'OUT' THEN
        v_balance_after := v_balance_before - v_total_deduction;
    ELSE
        -- Kalo Transaksi Masuk (Topup), Admin Fee biasanya 0 atau motong jumlah masuk?
        -- Anggap aja Topup nambah murni
        v_balance_after := v_balance_before + p_amount; 
    END IF;

    -- 5. UPDATE SALDO DI BANK CONFIG
    UPDATE glory.bank_config
    SET current_balance = v_balance_after,
        updated_at = now()
    WHERE id = p_bank_id;

    -- 6. INSERT TRANSAKSI (Simpen Admin Fee-nya juga!)
    INSERT INTO glory.bank_transactions (
        owner_id,
        transfer_id,
        entry_datetime,
        customer_id,
        bank_id,
        type_transactions,
        amount,
        admin_fee, -- Masukin hasil hitungan tadi
        balance_before,
        balance_after,
        description,
        status,
        is_check,
        created_at,
        updated_at
    ) VALUES (
        auth.uid(),
        p_transfer_id,
        now(),
        v_customer_id,
        p_bank_id,
        p_type_transactions,
        p_amount,
        v_admin_fee, -- << INI PENTING
        v_balance_before,
        v_balance_after,
        p_description,
        'completed',
        true,
        now(),
        now()
    );

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION glory.submit_bank_transaction_v2(
    p_transfer_id TEXT,
    p_bank_id UUID, -- UUID sesuai interface bank_id
    p_amount DECIMAL(12, 2),
    p_type_transactions CHAR(3), -- misal 'OUT'
    p_description TEXT,
    p_customer_name TEXT,
    p_customer_bank_account TEXT,
    p_customer_bank_name TEXT
) RETURNS VOID AS $$
DECLARE
    v_customer_id INT8;
    v_balance_before DECIMAL(15, 2);
    v_balance_after DECIMAL(15, 2);
BEGIN
    -- 1. UPSERT CUSTOMER (Biar gak duplikat, kalo nama/rekening sama kita ambil ID-nya)
    -- Ini asumsi lu mau record customer setiap transaksi
    INSERT INTO glory.bank_customers (customer_name, customer_bank_account, customer_bank_name, updated_at, created_at)
    VALUES (p_customer_name, p_customer_bank_account, p_customer_bank_name, now(), now())
    ON CONFLICT (customer_bank_account) -- Pastiin ada unique constraint di kolom ini
    DO UPDATE SET updated_at = now()
    RETURNING customer_id INTO v_customer_id;

    -- 2. LOCK BANK CONFIG & AMBIL SALDO SEBELUM
    -- Kita lock row bank gua buat dapet balance_before yang valid
    SELECT current_balance INTO v_balance_before
    FROM glory.bank_config
    WHERE id = p_bank_id
    FOR UPDATE;

    -- Validasi saldo (Kalo pengeluaran/OUT)
    IF p_type_transactions = 'OUT' AND v_balance_before < p_amount THEN
        RAISE EXCEPTION 'Saldo bank tidak cukup! Sisa: %', v_balance_before;
    END IF;

    -- 3. HITUNG SALDO SESUDAH
    IF p_type_transactions = 'OUT' THEN
        v_balance_after := v_balance_before - p_amount;
    ELSE
        v_balance_after := v_balance_before + p_amount;
    END IF;

    -- 4. UPDATE SALDO DI BANK CONFIG
    UPDATE glory.bank_config
    SET current_balance = v_balance_after,
        updated_at = now()
    WHERE id = p_bank_id;

    -- 5. INSERT KE BANK TRANSACTIONS (Record Utama)
    INSERT INTO glory.bank_transactions (
        owner_id,
        transfer_id,
        entry_datetime,
        customer_id,
        bank_id,
        type_transactions,
        amount,
        balance_before,
        balance_after,
        description,
        status, -- pake enum lu, misal 'success'
        is_check,
        created_at,
        updated_at
    ) VALUES (
        auth.uuid(),
        p_transfer_id,
        now(),
        v_customer_id,
        p_bank_id,
        p_type_transactions,
        p_amount,
        v_balance_before,
        v_balance_after,
        p_description,
        'success', -- StatusBankEnum.SUCCESS
        true,
        now(),
        now()
    );

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION glory.fn_handle_transaction_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_total_deduction decimal(15,2);
BEGIN
    -- LOGIC 1: REFUND (Duit Balik ke Brankas)
    -- Jika status berubah dari 'completed' ke 'canceled' atau 'pending'
    IF (OLD.status = 'completed') AND (NEW.status IN ('canceled', 'pending')) THEN
        
        -- Hitung berapa yang harus dibalikin (Nominal + Admin)
        v_total_deduction := OLD.amount + COALESCE(OLD.admin_fee, 0);

        IF OLD.type_transactions = 'OUT' THEN
            -- Duit keluar yang batal -> Saldo Brankas Nambah (Refund)
            UPDATE glory.bank_config 
            SET current_balance = current_balance + v_total_deduction,
                updated_at = now()
            WHERE id = OLD.bank_id;
        
        ELSIF OLD.type_transactions = 'IN' THEN
            -- Duit masuk yang batal -> Saldo Brankas dikurangin lagi
            UPDATE glory.bank_config 
            SET current_balance = current_balance - OLD.amount,
                updated_at = now()
            WHERE id = OLD.bank_id;
        END IF;

    -- LOGIC 2: RE-DEDUCT (Potong Lagi)
    -- Jika status berubah dari 'pending'/'canceled' balik lagi ke 'completed'
    ELSIF (OLD.status IN ('canceled', 'pending')) AND (NEW.status = 'completed') THEN
        
        v_total_deduction := NEW.amount + COALESCE(NEW.admin_fee, 0);

        IF NEW.type_transactions = 'OUT' THEN
            -- Jadi sukses lagi -> Potong lagi saldonya
            UPDATE glory.bank_config 
            SET current_balance = current_balance - v_total_deduction,
                updated_at = now()
            WHERE id = NEW.bank_id;
            
        ELSIF NEW.type_transactions = 'IN' THEN
            -- Jadi masuk lagi -> Tambah lagi saldonya
            UPDATE glory.bank_config 
            SET current_balance = current_balance + NEW.amount,
                updated_at = now()
            WHERE id = NEW.bank_id;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

INSERT INTO glory.bank_config (id, bank_name, account_name, account_number, current_balance, is_free)
VALUES 
  (gen_random_uuid(), 'BCA', 'RAFI ANGGORO', '167294101', 0, false),
  (gen_random_uuid(), 'MANDIRI', 'RAFI ANGGORO', '1330030779193', 0, false),
  (gen_random_uuid(), 'DANAMON', 'RAFI ANGGORO', '003700553526', 0, true),
  (gen_random_uuid(), 'DANAMON_QR', 'RAFI ANGGORO', '003661957989', 0, true),
  (gen_random_uuid(), 'BNI', 'RAFI ANGGORO', '1397774292', 0, false),
  (gen_random_uuid(), 'BRI', 'RAFI ANGGORO', '042101036812502', 0, false);

  
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
CREATE INDEX idx_bank_cust_bank_account ON glory.bank_customers(customer_bank_account);
CREATE INDEX idx_bank_config_tenant_id ON glory.bank_config(tenant_id);

--- DKT Daerah Kekuasaan Trigger ---
CREATE TRIGGER trg_update_bank_transactions BEFORE UPDATE ON glory.bank_transactions FOR EACH ROW EXECUTE FUNCTION glory.update_updated_at_column();
CREATE TRIGGER trg_update_bank_customers BEFORE UPDATE ON glory.bank_customers FOR EACH ROW EXECUTE FUNCTION glory.update_updated_at_column();
CREATE TRIGGER trg_update_bank_config BEFORE UPDATE ON glory.bank_config FOR EACH ROW EXECUTE FUNCTION glory.update_updated_at_column();

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


-- Kasih izin akses schema ke user yang login & anonim (buat public API)
GRANT USAGE ON SCHEMA glory TO authenticated, anon;

-- Kasih izin buat SELECT, INSERT, UPDATE di semua tabel dalam schema glory
GRANT ALL ON ALL TABLES IN SCHEMA glory TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA glory TO authenticated;-- Kasih izin akses schema ke user yang login & anonim (buat public API)
GRANT USAGE ON SCHEMA glory TO authenticated, anon;

-- Kasih izin buat SELECT, INSERT, UPDATE di semua tabel dalam schema glory
GRANT ALL ON ALL TABLES IN SCHEMA glory TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA glory TO authenticated;


CREATE TRIGGER trg_add_points_on_success
AFTER UPDATE ON glory.services_transactions
FOR EACH ROW
EXECUTE FUNCTION glory.handle_update_points();

CREATE OR REPLACE FUNCTION glory.handle_update_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Cek kalo status berubah jadi 'success' 
    -- DAN picked_up sekarang ada isinya (bukan NULL)
    -- DAN owner_id-nya valid
    IF (NEW.status = 'success' AND NEW.picked_up IS NOT NULL) THEN
        
        -- Tambahin poin ke tabel profile yang id-nya cocok sama owner_id transaksi
        UPDATE glory.profiles
        SET point = COALESCE(point, 0) + 5000
        WHERE id = NEW.owner_id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hapus dulu trigger lama kalau ada
DROP TRIGGER IF EXISTS trg_gen_cust_id ON glory.services_customers;

-- Pasang ulang
CREATE TRIGGER trg_gen_cust_id
BEFORE INSERT ON glory.services_customers
FOR EACH ROW
EXECUTE FUNCTION glory.generate_glory_ids();

DROP FUNCTION IF EXISTS glory.preview_next_invoice_id(text);

CREATE OR REPLACE FUNCTION glory.preview_next_invoice_id(p_location TEXT)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER -- Wajib biar MAX(id) akurat lintas user
SET search_path = glory, public -- Biar dia gak bingung nyari tabelnya
AS $$
DECLARE
    v_date_part TEXT := to_char(CURRENT_DATE, 'DDMMYYYY');
    v_next_id_int BIGINT;
    v_seq_id TEXT;
    v_branch_code TEXT;
BEGIN
    -- Mapping lokasi
    v_branch_code := CASE 
        WHEN p_location IS NULL OR p_location = '' THEN 'GL'
        WHEN lower(p_location) = 'sukahati' THEN 'SKHT'
        WHEN lower(p_location) = 'cikaret' THEN 'CKRT'
        WHEN lower(p_location) = 'sukabumi' THEN 'SKBM'
        ELSE 'GL' 
    END;

    -- Ambil ID terakhir dari seluruh tabel (bukan cuma milik user login)
    SELECT COALESCE(MAX(id), 0) + 1 INTO v_next_id_int 
    FROM glory.services_transactions;

    v_seq_id := LPAD(v_next_id_int::text, 4, '0');

    -- Gua balikin strip-nya ya biar gampang dibaca, kalau gak mau tinggal hapus aja '-' nya
    RETURN 'GPS-' || v_branch_code ||  v_seq_id || v_date_part;
END;
$$;

-- 1. Kasih izin akses ke schema 'glory' buat role yang login (authenticated)
GRANT USAGE ON SCHEMA glory TO authenticated;
GRANT USAGE ON SCHEMA glory TO anon; -- (Opsional) kalau ada akses tanpa login

-- 2. Kasih izin buat semua operasi di dalem tabel-tabelnya
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA glory TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA glory TO authenticated;

-- 3. Biar kedepannya kalau lu bikin table baru nggak perlu GRANT lagi
ALTER DEFAULT PRIVILEGES IN SCHEMA glory GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA glory GRANT ALL ON SEQUENCES TO authenticated;


CREATE OR REPLACE FUNCTION glory.preview_next_invoice_id(p_location TEXT)
RETURNS TEXT AS $$
DECLARE
    v_date_part TEXT := to_char(CURRENT_DATE, 'DDMMYYYY');
    v_seq_id TEXT;
    v_branch_code TEXT;
BEGIN
    -- Mapping Logic yang sama kayak trigger
    v_branch_code := CASE 
        WHEN p_location IS NULL OR p_location = '' THEN 'GL'
        WHEN lower(p_location) = 'sukahati' THEN 'SKHT'
        WHEN lower(p_location) = 'cikaret' THEN 'CKRT'
        WHEN lower(p_location) = 'sukabumi' THEN 'SKBM'
        ELSE 'GL' 
    END;

    -- Ambil nomor urut terakhir + 1 (tanpa naikin sequence asli)
    SELECT LPAD(COALESCE(MAX(id), 0) + 1::text, 4, '0') 
    INTO v_seq_id 
    FROM glory.services_transactions;

    RETURN 'GPS-' || v_branch_code || '-' || v_seq_id || '-' || v_date_part;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION glory.generate_glory_ids()
RETURNS TRIGGER AS $$
DECLARE
    v_date_part TEXT := to_char(CURRENT_DATE, 'DDMMYYYY');
    v_seq_id TEXT;
    v_branch_code TEXT;
    v_random_digits TEXT;
BEGIN
    -- 1. Logic buat CUSTOMER_ID (Format: GC-10 Digit Angka)
    IF (TG_TABLE_NAME = 'services_customers') THEN
        IF NEW.customer_id IS NULL THEN
            -- Generate 10 digit angka random
            v_random_digits := floor(random() * (9999999999 - 1000000000 + 1) + 1000000000)::text;
            NEW.customer_id := 'GC-' || v_random_digits;
        END IF;
    END IF;

    -- 2. Logic buat INVOICE_ID (Tetap yang lama)
    IF (TG_TABLE_NAME = 'services_transactions') THEN
        IF NEW.invoice_id IS NULL THEN
            v_branch_code := CASE 
                WHEN NEW.location IS NULL OR NEW.location = '' THEN 'GL'
                WHEN lower(NEW.location) = 'sukahati' THEN 'SKHT'
                WHEN lower(NEW.location) = 'cikaret' THEN 'CKRT'
                WHEN lower(NEW.location) = 'sukabumi' THEN 'SKBM'
                ELSE 'GL' 
            END;
            v_seq_id := LPAD(nextval(pg_get_serial_sequence('glory.services_transactions', 'id'))::text, 4, '0');
            NEW.invoice_id := 'GPS-' || v_branch_code || '-' || v_seq_id || '-' || v_date_part;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION glory.sync_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_role
AFTER UPDATE OF role ON glory.profiles
FOR EACH ROW EXECUTE FUNCTION glory.sync_role_to_auth();


CREATE OR REPLACE FUNCTION glory.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Update app_metadata di table auth.users (Supabase Auth)
  -- Kita set default role: 'user'
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'user')
  WHERE id = NEW.id;

  -- 2. Insert ke table profile kita (biar gampang di-query di app)
  INSERT INTO glory.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER wajib biar punya akses ke schema auth

-- Pasang triggernya di table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION glory.handle_new_user();


  CREATE TYPE user_role AS ENUM ('admin', 'frontliner', 'moderator', 'user');

CREATE TABLE IF NOT EXISTS glory.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    role user_role DEFAULT 'user',
    updated_at timestamp with time zone DEFAULT current_timestamp
);

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

