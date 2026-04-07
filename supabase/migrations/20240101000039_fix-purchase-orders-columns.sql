-- Fix purchase_orders table columns

-- Add missing columns
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivery_location TEXT,
ADD COLUMN IF NOT EXISTS delivery_province TEXT,
ADD COLUMN IF NOT EXISTS issue_date DATE;

-- Rename order_date to match form if it exists, otherwise use issue_date
UPDATE purchase_orders SET issue_date = order_date WHERE issue_date IS NULL;

-- Make order_number consistent (rename to po_number if needed)
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS po_number TEXT;

-- Copy data if order_number exists
UPDATE purchase_orders SET po_number = order_number WHERE po_number IS NULL;

-- Add unique constraint to po_number
ALTER TABLE purchase_orders 
DROP CONSTRAINT IF EXISTS purchase_orders_order_number_key,
ADD CONSTRAINT purchase_orders_po_number_unique UNIQUE (po_number);
