-- Delete all existing trips to avoid constraint violations
DELETE FROM trips;

-- Update trips table to include line specification (L1/L2) and particularity field

-- Add new columns
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS has_particularity BOOLEAN DEFAULT false;

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS particularity_notes TEXT;

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS line VARCHAR(2) CHECK (line IN ('L1', 'L2'));

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Drop and recreate the status constraint with new values
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips 
ADD CONSTRAINT trips_status_check 
CHECK (status IN ('pendiente', 'completado_l1', 'completado_l2', 'cancelado'));

-- Set default status to 'pendiente' (white)
ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'pendiente';

-- Create indexes for better performance on status, date and line queries
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_line ON trips(line);
