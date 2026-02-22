CREATE OR REPLACE VIEW driver_availability AS
SELECT 
  d.id,
  d.name,
  d.cuit,
  d.active,
  -- Always show drivers as available
  true as is_available,
  (
    SELECT t.id FROM trips t
    WHERE t.driver_id = d.id
    AND t.status IN ('pendiente', 'asignado', 'en viaje')
    ORDER BY t.date DESC
    LIMIT 1
  ) as active_trip_id,
  (
    SELECT t.status FROM trips t
    WHERE t.driver_id = d.id
    AND t.status IN ('pendiente', 'asignado', 'en viaje')
    ORDER BY t.date DESC
    LIMIT 1
  ) as trip_status,
  (
    SELECT m.description FROM maintenances m
    WHERE m.driver_id = d.id
    AND m.date >= CURRENT_DATE
    AND m.completed = FALSE
    ORDER BY m.date
    LIMIT 1
  ) as maintenance_description,
  -- Add count of pending/assigned trips
  (
    SELECT COUNT(*) FROM trips t
    WHERE t.driver_id = d.id
    AND t.status IN ('pendiente', 'asignado', 'en viaje')
  ) as pending_trips_count,
  -- Add count of upcoming maintenance
  (
    SELECT COUNT(*) FROM maintenances m
    WHERE m.driver_id = d.id
    AND m.date >= CURRENT_DATE
    AND m.completed = FALSE
  ) as upcoming_maintenance_count
FROM drivers d
WHERE d.active = true;

-- Create a view to show all pending assignments for a driver
CREATE OR REPLACE VIEW driver_pending_assignments AS
SELECT 
  d.id as driver_id,
  d.name as driver_name,
  'trip' as assignment_type,
  t.id as assignment_id,
  t.date as assignment_date,
  t.status,
  t.client_name,
  t.loading_location,
  t.unloading_location,
  NULL as description
FROM drivers d
JOIN trips t ON t.driver_id = d.id
WHERE t.status IN ('pendiente', 'asignado', 'en viaje')
  AND d.active = true

UNION ALL

SELECT 
  d.id as driver_id,
  d.name as driver_name,
  'maintenance' as assignment_type,
  m.id as assignment_id,
  m.date as assignment_date,
  CASE WHEN m.completed THEN 'completado' ELSE 'programado' END as status,
  NULL as client_name,
  NULL as loading_location,
  NULL as unloading_location,
  m.description
FROM drivers d
JOIN maintenances m ON m.driver_id = d.id
WHERE m.completed = FALSE
  AND m.date >= CURRENT_DATE
  AND d.active = true

ORDER BY assignment_date;
