-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  cuit TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  payment_terms TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_number TEXT NOT NULL UNIQUE,
  order_date DATE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  supplier_cuit TEXT,
  supplier_address TEXT,
  delivery_address TEXT,
  delivery_contact TEXT,
  delivery_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'received', 'cancelled')),
  payment_method TEXT,
  payment_terms TEXT,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  iva_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  authorized_by TEXT,
  authorized_date TIMESTAMP WITH TIME ZONE,
  received_date DATE,
  invoice_number TEXT
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'UN',
  unit_price DECIMAL(12, 2) NOT NULL,
  iva_rate DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
  subtotal DECIMAL(12, 2) NOT NULL,
  iva_amount DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);

-- Add RLS policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Suppliers policies
CREATE POLICY "Allow authenticated users to view suppliers" ON suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage suppliers" ON suppliers
  FOR ALL TO authenticated USING (true);

-- Purchase orders policies
CREATE POLICY "Allow authenticated users to view purchase orders" ON purchase_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage purchase orders" ON purchase_orders
  FOR ALL TO authenticated USING (true);

-- Purchase order items policies
CREATE POLICY "Allow authenticated users to view purchase order items" ON purchase_order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage purchase order items" ON purchase_order_items
  FOR ALL TO authenticated USING (true);

-- Add comments
COMMENT ON TABLE suppliers IS 'Proveedores para órdenes de compra';
COMMENT ON TABLE purchase_orders IS 'Órdenes de compra';
COMMENT ON TABLE purchase_order_items IS 'Items/líneas de las órdenes de compra';
