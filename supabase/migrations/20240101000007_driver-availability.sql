-- Add driver_id to maintenances table (for scheduled maintenances)
ALTER TABLE maintenances 
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_maintenances_driver ON maintenances(driver_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_date ON maintenances(date);

-- Create a function to check driver availability
CREATE OR REPLACE FUNCTION is_driver_available(
  p_driver_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
DECLARE
  has_active_trips INTEGER;
  has_scheduled_maintenance INTEGER;
BEGIN
  -- Check if driver has active trips (asignado or en viaje)
  SELECT COUNT(*) INTO has_active_trips
  FROM trips
  WHERE driver_id = p_driver_id
    AND status IN ('asignado', 'en viaje')
    AND date <= p_date;
  
  -- Check if driver has scheduled maintenance on that date
  SELECT COUNT(*) INTO has_scheduled_maintenance
  FROM maintenances
  WHERE driver_id = p_driver_id
    AND date = p_date
    AND completed = FALSE;
  
  -- Driver is available if no active trips and no scheduled maintenance
  RETURN (has_active_trips = 0 AND has_scheduled_maintenance = 0);
END;
$$ LANGUAGE plpgsql;

-- Create a view for driver availability status
CREATE OR REPLACE VIEW driver_availability AS
SELECT 
  d.id,
  d.name,
  d.cuit,
  d.active,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM trips t 
      WHERE t.driver_id = d.id 
      AND t.status IN ('asignado', 'en viaje')
    ) THEN false
    WHEN EXISTS (
      SELECT 1 FROM maintenances m
      WHERE m.driver_id = d.id
      AND m.date = CURRENT_DATE
      AND m.completed = FALSE
    ) THEN false
    ELSE true
  END as is_available,
  (
    SELECT t.id FROM trips t
    WHERE t.driver_id = d.id
    AND t.status IN ('asignado', 'en viaje')
    ORDER BY t.date DESC
    LIMIT 1
  ) as active_trip_id,
  (
    SELECT t.status FROM trips t
    WHERE t.driver_id = d.id
    AND t.status IN ('asignado', 'en viaje')
    ORDER BY t.date DESC
    LIMIT 1
  ) as trip_status,
  (
    SELECT m.description FROM maintenances m
    WHERE m.driver_id = d.id
    AND m.date = CURRENT_DATE
    AND m.completed = FALSE
    ORDER BY m.date
    LIMIT 1
  ) as maintenance_description
FROM drivers d
WHERE d.active = true;
