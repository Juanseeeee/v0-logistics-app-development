-- Simplify purchase_orders table to match real requirements
-- Remove IVA and other unnecessary fields

ALTER TABLE purchase_orders DROP COLUMN IF EXISTS iva_amount;
ALTER TABLE purchase_orders DROP COLUMN IF EXISTS subtotal;
ALTER TABLE purchase_orders ALTER COLUMN total SET NOT NULL;

-- Simplify purchase_order_items to match PDF format
-- Item, Código, Artículo, Cantidad, Costo, Total Item
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS iva_amount;
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS iva_rate;
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS unit;
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS total;
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS subtotal;

-- Add proper columns
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS total_item NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Update existing data
UPDATE purchase_order_items SET total_item = quantity * unit_price WHERE total_item = 0;

COMMENT ON COLUMN purchase_order_items.item_number IS 'Número de ítem en la orden';
COMMENT ON COLUMN purchase_order_items.code IS 'Código del artículo/servicio';
COMMENT ON COLUMN purchase_order_items.description IS 'Descripción del artículo/servicio';
COMMENT ON COLUMN purchase_order_items.quantity IS 'Cantidad';
COMMENT ON COLUMN purchase_order_items.unit_price IS 'Costo unitario';
COMMENT ON COLUMN purchase_order_items.total_item IS 'Total del ítem (cantidad × costo)';
