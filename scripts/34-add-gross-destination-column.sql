-- Add missing column for gross weight at destination
ALTER TABLE l2_trips ADD COLUMN IF NOT EXISTS gross_destination numeric;

-- Update the column comment
COMMENT ON COLUMN l2_trips.gross_destination IS 'Gross weight at destination (Bruto D)';
