-- Crear tabla de tipos de mantenimiento predefinidos con intervalos estándar
-- Basado en estándares de la industria para camiones de transporte pesado

-- Primero eliminamos la tabla si existe para recrearla
DROP TABLE IF EXISTS maintenance_types CASCADE;

CREATE TABLE maintenance_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  interval_days INTEGER, -- Intervalo en días (ejemplo: 180 días = 6 meses)
  interval_km INTEGER, -- Intervalo en kilómetros
  alert_days_before INTEGER DEFAULT 15, -- Días de anticipación para alertar
  alert_km_before INTEGER DEFAULT 1000, -- Kilómetros de anticipación para alertar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar tipos de mantenimiento predefinidos según estándares argentinos
INSERT INTO maintenance_types (name, description, interval_days, interval_km, alert_days_before, alert_km_before) VALUES
('VTV', 'Verificación Técnica Vehicular obligatoria', 365, NULL, 30, NULL),
('Cambio de Aceite', 'Cambio de aceite del motor y filtro', 180, 15000, 15, 1000),
('Filtro de Aire', 'Reemplazo del filtro de aire del motor', NULL, 40000, NULL, 3000),
('Filtro de Combustible', 'Reemplazo del filtro de combustible', NULL, 40000, NULL, 3000),
('Cambio de Bujes', 'Reemplazo de bujes de suspensión', 365, 80000, 30, 5000),
('Sistema de Frenos', 'Revisión y mantenimiento del sistema de frenos', NULL, 25000, NULL, 2000),
('Neumáticos', 'Inspección y rotación de neumáticos', 90, NULL, 7, NULL),
('Sistema de Refrigeración', 'Revisión y cambio de refrigerante', NULL, 50000, NULL, 3000),
('Batería', 'Revisión del sistema eléctrico y batería', 90, NULL, 7, NULL),
('Transmisión', 'Cambio del fluido de la transmisión', NULL, 100000, NULL, 5000),
('Suspensión', 'Revisión de amortiguadores y muelles', 180, NULL, 15, NULL);

-- Recrear la vista de alertas de mantenimiento con mejor lógica
DROP VIEW IF EXISTS maintenance_alerts CASCADE;

CREATE OR REPLACE VIEW maintenance_alerts AS
SELECT 
  m.id,
  m.vehicle_id,
  v.patent_chasis,
  v.vehicle_type,
  m.description,
  m.next_service_date,
  m.next_service_km,
  v.kilometers as current_km,
  -- Calcular tipo de alerta basado en umbrales configurables
  CASE 
    WHEN m.next_service_date IS NOT NULL 
         AND m.next_service_date <= CURRENT_DATE + INTERVAL '30 days' 
    THEN 'date'
    WHEN m.next_service_km IS NOT NULL 
         AND v.kilometers >= (m.next_service_km - 3000) 
    THEN 'kilometers'
    ELSE NULL
  END as alert_type,
  -- Corregir cálculo de días hasta el próximo servicio usando DATE_PART
  CASE 
    WHEN m.next_service_date IS NOT NULL 
    THEN (m.next_service_date::DATE - CURRENT_DATE::DATE)
    ELSE NULL
  END as days_until_service,
  -- Kilómetros hasta el próximo servicio (negativo si está excedido)
  CASE 
    WHEN m.next_service_km IS NOT NULL 
    THEN (m.next_service_km - v.kilometers)
    ELSE NULL
  END as km_until_service,
  -- Nivel de urgencia (critical, warning, info)
  CASE 
    WHEN (m.next_service_date IS NOT NULL AND m.next_service_date < CURRENT_DATE)
         OR (m.next_service_km IS NOT NULL AND v.kilometers > m.next_service_km)
    THEN 'critical'
    WHEN (m.next_service_date IS NOT NULL AND m.next_service_date <= CURRENT_DATE + INTERVAL '7 days')
         OR (m.next_service_km IS NOT NULL AND v.kilometers >= (m.next_service_km - 500))
    THEN 'warning'
    ELSE 'info'
  END as urgency_level
FROM maintenances m
JOIN vehicles v ON m.vehicle_id = v.id
WHERE 
  m.completed = false
  OR
  (m.next_service_date IS NOT NULL AND m.next_service_date <= CURRENT_DATE + INTERVAL '30 days')
  OR
  (m.next_service_km IS NOT NULL AND v.kilometers >= (m.next_service_km - 3000))
ORDER BY 
  -- Priorizar por urgencia
  CASE 
    WHEN (m.next_service_date IS NOT NULL AND m.next_service_date < CURRENT_DATE)
         OR (m.next_service_km IS NOT NULL AND v.kilometers > m.next_service_km)
    THEN 1
    WHEN (m.next_service_date IS NOT NULL AND m.next_service_date <= CURRENT_DATE + INTERVAL '7 days')
         OR (m.next_service_km IS NOT NULL AND v.kilometers >= (m.next_service_km - 500))
    THEN 2
    ELSE 3
  END,
  COALESCE(m.next_service_date, CURRENT_DATE + INTERVAL '999 days'),
  COALESCE(m.next_service_km, 999999);

-- Crear vista para sugerencias automáticas de mantenimiento
-- Esta vista sugiere qué mantenimientos deberían programarse basándose en el último servicio
CREATE OR REPLACE VIEW maintenance_suggestions AS
WITH last_maintenances AS (
  SELECT 
    m.vehicle_id,
    mt.name as maintenance_type,
    mt.description,
    mt.interval_days,
    mt.interval_km,
    mt.alert_days_before,
    mt.alert_km_before,
    MAX(m.date) as last_service_date,
    MAX(m.kilometers_at_service) as last_service_km
  FROM maintenances m
  JOIN maintenance_types mt ON m.description ILIKE '%' || mt.name || '%'
  WHERE m.completed = true
  GROUP BY m.vehicle_id, mt.id, mt.name, mt.description, mt.interval_days, mt.interval_km, mt.alert_days_before, mt.alert_km_before
)
SELECT 
  v.id as vehicle_id,
  v.patent_chasis,
  v.vehicle_type,
  v.kilometers as current_km,
  lm.maintenance_type,
  lm.description,
  lm.last_service_date,
  lm.last_service_km,
  -- Calcular próxima fecha de servicio
  CASE 
    WHEN lm.interval_days IS NOT NULL 
    THEN lm.last_service_date + (lm.interval_days || ' days')::INTERVAL
    ELSE NULL
  END as suggested_next_date,
  -- Calcular próximo kilometraje de servicio
  CASE 
    WHEN lm.interval_km IS NOT NULL 
    THEN lm.last_service_km + lm.interval_km
    ELSE NULL
  END as suggested_next_km,
  -- Verificar si necesita alerta
  CASE 
    WHEN lm.interval_days IS NOT NULL 
         AND lm.last_service_date + (lm.interval_days || ' days')::INTERVAL <= CURRENT_DATE + (lm.alert_days_before || ' days')::INTERVAL
    THEN true
    WHEN lm.interval_km IS NOT NULL 
         AND v.kilometers >= (lm.last_service_km + lm.interval_km - lm.alert_km_before)
    THEN true
    ELSE false
  END as needs_alert
FROM vehicles v
CROSS JOIN maintenance_types mt
LEFT JOIN last_maintenances lm 
  ON v.id = lm.vehicle_id 
  AND mt.name = lm.maintenance_type
WHERE v.kilometers > 0;

-- Índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_maintenances_completed ON maintenances(completed);
CREATE INDEX IF NOT EXISTS idx_maintenances_type ON maintenances(maintenance_type_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_types_name ON maintenance_types(name);
