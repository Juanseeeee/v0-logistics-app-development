-- Script para refrescar las vistas de mantenimiento
-- Estas son vistas generadas automáticamente, no tablas

-- Si necesitas recrear las vistas desde cero, ejecuta esto:

-- Primero elimina las vistas existentes
DROP VIEW IF EXISTS maintenance_alerts CASCADE;
DROP VIEW IF EXISTS maintenance_suggestions CASCADE;

-- Recrea la vista de alertas de mantenimiento
CREATE OR REPLACE VIEW maintenance_alerts AS
SELECT 
  v.id as vehicle_id,
  v.patent_chasis,
  v.vehicle_type,
  m.id,
  m.next_service_date,
  m.next_service_km,
  v.kilometers as current_km,
  CASE 
    WHEN m.next_service_date IS NOT NULL THEN 
      (m.next_service_date - CURRENT_DATE)
    ELSE NULL 
  END as days_until_service,
  CASE 
    WHEN m.next_service_km IS NOT NULL AND v.kilometers IS NOT NULL THEN 
      (m.next_service_km - v.kilometers)
    ELSE NULL 
  END as km_until_service,
  CASE
    WHEN m.next_service_date <= CURRENT_DATE OR (m.next_service_km IS NOT NULL AND v.kilometers >= m.next_service_km) THEN 'overdue'
    WHEN (m.next_service_date <= CURRENT_DATE + INTERVAL '7 days') OR 
         (m.next_service_km IS NOT NULL AND v.kilometers >= m.next_service_km - 1000) THEN 'urgent'
    WHEN (m.next_service_date <= CURRENT_DATE + INTERVAL '30 days') OR 
         (m.next_service_km IS NOT NULL AND v.kilometers >= m.next_service_km - 5000) THEN 'upcoming'
    ELSE 'normal'
  END as urgency_level,
  CASE
    WHEN m.next_service_date <= CURRENT_DATE THEN 'date'
    WHEN m.next_service_km IS NOT NULL AND v.kilometers >= m.next_service_km THEN 'kilometers'
    WHEN (m.next_service_date <= CURRENT_DATE + INTERVAL '30 days') THEN 'date'
    WHEN (m.next_service_km IS NOT NULL AND v.kilometers >= m.next_service_km - 5000) THEN 'kilometers'
    ELSE NULL
  END as alert_type,
  mt.name || ' - ' || COALESCE(m.description, '') as description
FROM vehicles v
INNER JOIN maintenances m ON v.id = m.vehicle_id
LEFT JOIN maintenance_types mt ON m.maintenance_type_id = mt.id
WHERE m.completed = false
  AND (
    m.next_service_date <= CURRENT_DATE + INTERVAL '30 days'
    OR (m.next_service_km IS NOT NULL AND v.kilometers >= m.next_service_km - 5000)
  );

-- Recrea la vista de sugerencias de mantenimiento
CREATE OR REPLACE VIEW maintenance_suggestions AS
SELECT 
  v.id as vehicle_id,
  v.patent_chasis,
  v.vehicle_type,
  v.kilometers as current_km,
  mt.name as maintenance_type,
  m.date as last_service_date,
  m.kilometers_at_service as last_service_km,
  m.next_service_date as suggested_next_date,
  m.next_service_km as suggested_next_km,
  mt.description,
  CASE
    WHEN m.next_service_date <= CURRENT_DATE + INTERVAL '30 days' 
      OR (m.next_service_km IS NOT NULL AND v.kilometers >= m.next_service_km - 5000) 
    THEN true
    ELSE false
  END as needs_alert
FROM vehicles v
CROSS JOIN maintenance_types mt
LEFT JOIN LATERAL (
  SELECT *
  FROM maintenances m2
  WHERE m2.vehicle_id = v.id 
    AND m2.maintenance_type_id = mt.id
    AND m2.completed = true
  ORDER BY m2.date DESC
  LIMIT 1
) m ON true
WHERE v.transport_company = 'Cronos';

-- Mensaje de confirmación
SELECT 'Las vistas de mantenimiento han sido refrescadas correctamente' as status;
