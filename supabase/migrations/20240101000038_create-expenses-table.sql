-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  invoice_number VARCHAR(100),
  receipt_number VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view expenses" ON expenses
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'owner', 'manager')
  ));

CREATE POLICY "Admin and owner can insert expenses" ON expenses
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'owner')
  ));

CREATE POLICY "Admin and owner can update expenses" ON expenses
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'owner')
  ));

CREATE POLICY "Admin can delete expenses" ON expenses
  FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));
