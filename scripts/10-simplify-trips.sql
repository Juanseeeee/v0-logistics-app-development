-- Modify trips table to use text fields for client and product instead of foreign keys
-- Add search field for driver selection

-- Drop foreign key constraint on client_id
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_client_id_fkey;

-- Rename and change client_id column to client_name as TEXT
ALTER TABLE trips RENAME COLUMN client_id TO client_name;
ALTER TABLE trips ALTER COLUMN client_name TYPE TEXT;

-- Product is already TEXT, so no change needed

-- Add index for faster searching
CREATE INDEX IF NOT EXISTS idx_trips_client_name ON trips(client_name);
CREATE INDEX IF NOT EXISTS idx_trips_product ON trips(product);
