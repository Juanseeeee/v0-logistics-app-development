-- Add status field to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'asignado' CHECK (status IN ('asignado', 'en viaje', 'completado'));

-- Add coordinates for unloading location (last known location of driver)
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS unloading_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS unloading_lng DECIMAL(11, 8);

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- Create view for last completed trips per driver (for map visualization)
CREATE OR REPLACE VIEW driver_last_locations AS
SELECT DISTINCT ON (driver_id)
  t.driver_id,
  d.name as driver_name,
  t.unloading_location,
  t.unloading_lat,
  t.unloading_lng,
  t.date,
  t.id as trip_id,
  v_chasis.patent_chasis as chasis_patent,
  v_semi.patent_chasis as semi_patent
FROM trips t
JOIN drivers d ON t.driver_id = d.id
LEFT JOIN vehicles v_chasis ON d.chasis_id = v_chasis.id
LEFT JOIN vehicles v_semi ON d.semi_id = v_semi.id
WHERE t.status = 'completado' 
  AND t.unloading_lat IS NOT NULL 
  AND t.unloading_lng IS NOT NULL
ORDER BY t.driver_id, t.date DESC, t.created_at DESC;
