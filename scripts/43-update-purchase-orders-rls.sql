-- Update RLS for purchase orders and items to align with app roles
-- Roles allowed:
--  - View (SELECT): admin, owner, manager
--  - Modify (INSERT/UPDATE/DELETE): admin, owner
-- Assumes 'users' table contains row for auth.uid() with 'role' column

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if present
DROP POLICY IF EXISTS "Allow authenticated users to view purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow admins to manage purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated users to view purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Allow admins to manage purchase order items" ON purchase_order_items;

-- SELECT policies
CREATE POLICY "Finance roles can view purchase_orders"
  ON purchase_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner','manager')
    )
  );

CREATE POLICY "Finance roles can view purchase_order_items"
  ON purchase_order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner','manager')
    )
  );

-- INSERT policies
CREATE POLICY "Admins/Owners can insert purchase_orders"
  ON purchase_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner')
    )
  );

CREATE POLICY "Admins/Owners can insert purchase_order_items"
  ON purchase_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner')
    )
  );

-- UPDATE policies
CREATE POLICY "Admins/Owners can update purchase_orders"
  ON purchase_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner')
    )
  );

CREATE POLICY "Admins/Owners can update purchase_order_items"
  ON purchase_order_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner')
    )
  );

-- DELETE policies
CREATE POLICY "Admins/Owners can delete purchase_orders"
  ON purchase_orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner')
    )
  );

CREATE POLICY "Admins/Owners can delete purchase_order_items"
  ON purchase_order_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin','owner')
    )
  );
