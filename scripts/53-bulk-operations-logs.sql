-- Table for logging bulk operations (billing and settlement)
CREATE TABLE IF NOT EXISTS bulk_operations_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('billing', 'settlement')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trip_ids UUID[] NOT NULL,
  total_amount DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB -- Store filters used, file references, or other metadata
);

-- Add RLS policies
ALTER TABLE bulk_operations_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert logs"
  ON bulk_operations_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view logs"
  ON bulk_operations_logs FOR SELECT
  TO authenticated
  USING (true);
