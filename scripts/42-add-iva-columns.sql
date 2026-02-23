-- Add IVA-related columns to purchase_orders
-- Run this in Supabase SQL editor against your database
-- Persists whether IVA was applied, the percentage, and monetary breakdown

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS iva_applied BOOLEAN DEFAULT FALSE;

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS iva_percent NUMERIC(5,2);

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2);

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS iva_amount NUMERIC(12,2);

-- Initialize existing rows: assume no IVA; keep current total
UPDATE purchase_orders
SET subtotal = COALESCE(subtotal, total),
    iva_amount = COALESCE(iva_amount, 0),
    iva_applied = COALESCE(iva_applied, FALSE)
WHERE subtotal IS NULL OR iva_amount IS NULL OR iva_applied IS NULL;
