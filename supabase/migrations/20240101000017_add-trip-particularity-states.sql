-- Script 19: Add new trip states and line for particularities
-- Ejecutar este script para agregar los nuevos estados y línea L1/L2

-- 1. Agregar columna para almacenar detalles de particularidades si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'particularity'
  ) THEN
    ALTER TABLE trips ADD COLUMN particularity TEXT;
  END IF;
END $$;

-- Actualizar el constraint de line para incluir L1/L2
-- 2. Actualizar el constraint para la columna line para permitir L1/L2
DO $$
BEGIN
  -- Eliminar el constraint antiguo si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trips_line_check' AND table_name = 'trips'
  ) THEN
    ALTER TABLE trips DROP CONSTRAINT trips_line_check;
  END IF;
  
  -- Crear el nuevo constraint con L1/L2 incluido
  ALTER TABLE trips ADD CONSTRAINT trips_line_check 
    CHECK (line IN ('L1', 'L2', 'L1/L2'));
END $$;

-- Actualizar el constraint de status para incluir los nuevos estados
-- 3. Actualizar el constraint para la columna status para permitir nuevos estados
DO $$
BEGIN
  -- Eliminar el constraint antiguo si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trips_status_check' AND table_name = 'trips'
  ) THEN
    ALTER TABLE trips DROP CONSTRAINT trips_status_check;
  END IF;
  
  -- Crear el nuevo constraint con todos los estados incluyendo los nuevos
  ALTER TABLE trips ADD CONSTRAINT trips_status_check 
    CHECK (status IN ('pendiente', 'completado_l1', 'completado_l2', 'completado_l1_l2', 'completado_particularidad', 'cancelado'));
END $$;

-- 4. Comentarios para documentación
COMMENT ON COLUMN trips.status IS 'Estados: pendiente, completado_l1, completado_l2, completado_l1_l2, completado_particularidad, cancelado';
COMMENT ON COLUMN trips.line IS 'Líneas: L1, L2, L1/L2';
COMMENT ON COLUMN trips.particularity IS 'Descripción de la particularidad cuando el estado es completado_particularidad o cancelado';

-- 5. Actualizar la vista de disponibilidad de choferes para considerar los nuevos estados
CREATE OR REPLACE VIEW driver_availability AS
SELECT 
  d.id,
  d.name,
  d.cuit,
  d.active,
  CASE 
    WHEN d.active = false THEN false
    WHEN m.id IS NOT NULL AND m.completed = false THEN false
    WHEN t.id IS NOT NULL AND t.status IN ('pendiente', 'completado_l1', 'completado_l2', 'completado_l1_l2', 'completado_particularidad') THEN false
    ELSE true
  END AS is_available,
  t.id as active_trip_id,
  t.status as trip_status,
  m.description as maintenance_description
FROM drivers d
LEFT JOIN LATERAL (
  SELECT id, status 
  FROM trips 
  WHERE driver_id = d.id 
    AND status IN ('pendiente', 'completado_l1', 'completado_l2', 'completado_l1_l2', 'completado_particularidad')
    AND date >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY date DESC 
  LIMIT 1
) t ON true
LEFT JOIN LATERAL (
  SELECT id, description, completed
  FROM maintenances
  WHERE vehicle_id = d.chasis_id 
    AND completed = false
  ORDER BY date DESC
  LIMIT 1
) m ON true
WHERE d.active = true;
