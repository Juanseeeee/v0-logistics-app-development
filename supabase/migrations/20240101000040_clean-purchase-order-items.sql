-- Clean unnecessary and redundant columns from purchase_order_items
-- IVA is calculated at order level, not item level
-- Total is redundant since we have subtotal
-- Unit is not used in the form

ALTER TABLE purchase_order_items ALTER COLUMN iva_amount DROP NOT NULL;
ALTER TABLE purchase_order_items ALTER COLUMN iva_rate DROP NOT NULL;
ALTER TABLE purchase_order_items ALTER COLUMN unit DROP NOT NULL;
ALTER TABLE purchase_order_items ALTER COLUMN total DROP NOT NULL;

-- Set default values for existing rows
UPDATE purchase_order_items SET iva_amount = 0 WHERE iva_amount IS NULL;
UPDATE purchase_order_items SET iva_rate = 0 WHERE iva_rate IS NULL;
UPDATE purchase_order_items SET unit = '' WHERE unit IS NULL;
UPDATE purchase_order_items SET total = subtotal WHERE total IS NULL;
