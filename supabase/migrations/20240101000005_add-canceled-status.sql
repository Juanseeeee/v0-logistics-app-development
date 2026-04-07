-- Update the status constraint to include 'cancelado'
ALTER TABLE trips 
DROP CONSTRAINT IF EXISTS trips_status_check;

ALTER TABLE trips
ADD CONSTRAINT trips_status_check 
CHECK (status IN ('asignado', 'en viaje', 'completado', 'cancelado'));
