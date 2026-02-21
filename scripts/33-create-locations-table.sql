-- Create locations table for loading and unloading places
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Argentina',
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  location_type VARCHAR(50), -- 'loading', 'unloading', 'both'
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update locations"
  ON locations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete locations"
  ON locations FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX idx_locations_name ON locations(name);
CREATE INDEX idx_locations_type ON locations(location_type);
CREATE INDEX idx_locations_active ON locations(active);

-- Migrate existing unique locations from trips table
INSERT INTO locations (name, address, location_type, active)
SELECT DISTINCT 
  loading_location as name,
  loading_location as address,
  'loading' as location_type,
  true as active
FROM trips
WHERE loading_location IS NOT NULL
  AND loading_location != ''
  AND NOT EXISTS (
    SELECT 1 FROM locations WHERE name = trips.loading_location
  )
ON CONFLICT DO NOTHING;

INSERT INTO locations (name, address, location_type, active)
SELECT DISTINCT 
  unloading_location as name,
  unloading_location as address,
  'unloading' as location_type,
  true as active
FROM trips
WHERE unloading_location IS NOT NULL
  AND unloading_location != ''
  AND NOT EXISTS (
    SELECT 1 FROM locations WHERE name = trips.unloading_location
  )
ON CONFLICT DO NOTHING;

-- Update locations to 'both' if they appear in both loading and unloading
UPDATE locations
SET location_type = 'both'
WHERE name IN (
  SELECT l1.name
  FROM locations l1
  INNER JOIN locations l2 ON l1.name = l2.name
  WHERE l1.location_type = 'loading' AND l2.location_type = 'unloading'
);

-- Remove duplicates keeping 'both' type
DELETE FROM locations
WHERE id IN (
  SELECT l.id
  FROM locations l
  INNER JOIN locations l2 ON l.name = l2.name AND l.id != l2.id
  WHERE l2.location_type = 'both' AND l.location_type != 'both'
);
