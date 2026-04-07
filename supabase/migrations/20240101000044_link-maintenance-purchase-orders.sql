-- Create table for linking Maintenances to Purchase Orders (Header level)
CREATE TABLE IF NOT EXISTS maintenance_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES maintenances(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  allocated_amount NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(maintenance_id, purchase_order_id)
);

-- Create table for linking Maintenances to Purchase Order Items (Detail level)
CREATE TABLE IF NOT EXISTS maintenance_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES maintenances(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
  quantity_used NUMERIC(10, 2) NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mpo_maintenance ON maintenance_purchase_orders(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_mpo_purchase_order ON maintenance_purchase_orders(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_mpoi_maintenance ON maintenance_purchase_order_items(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_mpoi_item ON maintenance_purchase_order_items(purchase_order_item_id);

-- RLS
ALTER TABLE maintenance_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- SELECT Policies (View: Admin, Owner, Manager, Fleet Docs, Reporter)
CREATE POLICY "View MPO" ON maintenance_purchase_orders
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'owner', 'manager', 'fleet_docs', 'reporter')
    )
  );

CREATE POLICY "View MPOI" ON maintenance_purchase_order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'owner', 'manager', 'fleet_docs', 'reporter')
    )
  );

-- INSERT Policies (Edit: Admin, Owner)
CREATE POLICY "Manage MPO Insert" ON maintenance_purchase_orders
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Manage MPOI Insert" ON maintenance_purchase_order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'owner')
    )
  );

-- UPDATE Policies
CREATE POLICY "Manage MPO Update" ON maintenance_purchase_orders
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner'))
  );

CREATE POLICY "Manage MPOI Update" ON maintenance_purchase_order_items
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner'))
  );

-- DELETE Policies
CREATE POLICY "Manage MPO Delete" ON maintenance_purchase_orders
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner'))
  );

CREATE POLICY "Manage MPOI Delete" ON maintenance_purchase_order_items
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner'))
  );
