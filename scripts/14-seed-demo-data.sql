-- Script para cargar datos de prueba completos
-- Ejecutar después del script 13

-- Limpiar datos existentes (opcional)
DELETE FROM fuel_records;
DELETE FROM maintenances;
DELETE FROM trips;
DELETE FROM drivers;
DELETE FROM vehicles;

-- ============================================
-- VEHÍCULOS - CHASIS (15 chasis)
-- ============================================
INSERT INTO vehicles (patent_chasis, vehicle_type, transport_company, kilometers) VALUES
('AA123CD', 'Chasis', 'Scania R450 (2020)', 185000),
('AA234DE', 'Chasis', 'Mercedes-Benz Actros 2041 (2019)', 220000),
('AA345EF', 'Chasis', 'Volvo FH 460 (2021)', 145000),
('AA456FG', 'Chasis', 'Scania G420 (2018)', 280000),
('AA567GH', 'Chasis', 'Iveco Stralis 570 (2020)', 195000),
('AA678HI', 'Chasis', 'Mercedes-Benz Actros 1844 (2019)', 235000),
('AA789IJ', 'Chasis', 'Scania R480 (2022)', 95000),
('AA890JK', 'Chasis', 'Volvo FH 540 (2021)', 165000),
('AA901KL', 'Chasis', 'Iveco Trakker 450 (2020)', 210000),
('AB012LM', 'Chasis', 'Scania P320 (2019)', 255000),
('AB123MN', 'Chasis', 'Mercedes-Benz Axor 2036 (2018)', 290000),
('AB234NO', 'Chasis', 'Volvo FM 440 (2021)', 155000),
('AB345OP', 'Chasis', 'Scania R500 (2022)', 85000),
('AB456PQ', 'Chasis', 'Iveco Stralis 460 (2020)', 205000),
('AB567QR', 'Chasis', 'Mercedes-Benz Actros 2046 (2021)', 175000);

-- ============================================
-- VEHÍCULOS - SEMIREMOLQUES (15 semis)
-- ============================================
INSERT INTO vehicles (patent_chasis, vehicle_type, transport_company, kilometers) VALUES
('BB123CD', 'Semiremolque', 'Randon Tanque 35000L (2020)', 185000),
('BB234DE', 'Semiremolque', 'Grosspal Tanque 30000L (2019)', 220000),
('BB345EF', 'Semiremolque', 'Cartamil Tanque 38000L (2021)', 145000),
('BB456FG', 'Semiremolque', 'Randon Tanque 32000L (2018)', 280000),
('BB567GH', 'Semiremolque', 'Acoplados Del Norte 35000L (2020)', 195000),
('BB678HI', 'Semiremolque', 'Grosspal Tanque 36000L (2019)', 235000),
('BB789IJ', 'Semiremolque', 'Randon Tanque 40000L (2022)', 95000),
('BB890JK', 'Semiremolque', 'Cartamil Tanque 34000L (2021)', 165000),
('BB901KL', 'Semiremolque', 'Randon Tanque 35000L (2020)', 210000),
('BC012LM', 'Semiremolque', 'Grosspal Tanque 33000L (2019)', 255000),
('BC123MN', 'Semiremolque', 'Acoplados Del Norte 37000L (2018)', 290000),
('BC234NO', 'Semiremolque', 'Cartamil Tanque 35000L (2021)', 155000),
('BC345OP', 'Semiremolque', 'Randon Tanque 42000L (2022)', 85000),
('BC456PQ', 'Semiremolque', 'Grosspal Tanque 34000L (2020)', 205000),
('BC567QR', 'Semiremolque', 'Cartamil Tanque 38000L (2021)', 175000);

-- ============================================
-- CHOFERES (15 choferes) vinculados a vehículos
-- ============================================
WITH chasis_vehicles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY patent_chasis) as rn
  FROM vehicles WHERE vehicle_type = 'Chasis'
),
semi_vehicles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY patent_chasis) as rn
  FROM vehicles WHERE vehicle_type = 'Semiremolque'
)
INSERT INTO drivers (name, cuit, chasis_id, semi_id, active)
SELECT 
  driver_name,
  driver_cuit,
  c.id,
  s.id,
  true
FROM (
  VALUES 
    ('Juan Carlos Rodríguez', '20-34567890-1', 1),
    ('María Elena Fernández', '27-45678901-2', 2),
    ('Roberto Miguel Gómez', '20-56789012-3', 3),
    ('Carlos Alberto Díaz', '20-67890123-4', 4),
    ('Pedro Martínez López', '20-78901234-5', 5),
    ('Luis Fernando Torres', '20-89012345-6', 6),
    ('Jorge Raúl Sánchez', '20-90123456-7', 7),
    ('Daniel Eduardo Romero', '20-01234567-8', 8),
    ('Miguel Ángel Castro', '20-12345678-9', 9),
    ('Gustavo Adrián Ruiz', '20-23456789-0', 10),
    ('Fernando José Morales', '20-34567801-1', 11),
    ('Ricardo Hernán Silva', '20-45678912-2', 12),
    ('Sergio Omar Vega', '20-56789023-3', 13),
    ('Andrés Pablo Ríos', '20-67890134-4', 14),
    ('Marcelo Guillermo Ramos', '20-78901245-5', 15)
) AS t(driver_name, driver_cuit, rn)
JOIN chasis_vehicles c ON c.rn = t.rn
JOIN semi_vehicles s ON s.rn = t.rn;

-- ============================================
-- VIAJES (30 viajes variados)
-- ============================================

-- Viajes completados L2 (verde) - 10 viajes
WITH numbered_drivers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn FROM drivers
)
INSERT INTO trips (driver_id, loading_location, unloading_location, date, client_name, product, status, line, unloading_address, unloading_lat, unloading_lng, completed_at)
SELECT 
    d.id,
    'Buenos Aires, Argentina',
    CASE rn % 5
        WHEN 0 THEN 'Rosario, Santa Fe'
        WHEN 1 THEN 'Córdoba, Córdoba'
        WHEN 2 THEN 'Mendoza, Mendoza'
        WHEN 3 THEN 'San Luis, San Luis'
        ELSE 'Ramallo, Buenos Aires'
    END,
    CURRENT_DATE - INTERVAL '1 day' * (rn % 10 + 1),
    'GBE',
    CASE rn % 5
        WHEN 0 THEN 'Aceite'
        WHEN 1 THEN 'Glicerina'
        WHEN 2 THEN 'Gas Oil'
        WHEN 3 THEN 'Oleina'
        ELSE 'Combustible'
    END,
    'completado_l2',
    'L2',
    CASE rn % 5
        WHEN 0 THEN 'Rosario, Santa Fe, Argentina'
        WHEN 1 THEN 'Córdoba, Córdoba, Argentina'
        WHEN 2 THEN 'Mendoza, Mendoza, Argentina'
        WHEN 3 THEN 'San Luis, San Luis, Argentina'
        ELSE 'Ramallo, Buenos Aires, Argentina'
    END,
    CASE rn % 5
        WHEN 0 THEN -32.9468
        WHEN 1 THEN -31.4201
        WHEN 2 THEN -32.8895
        WHEN 3 THEN -33.2995
        ELSE -33.4850
    END,
    CASE rn % 5
        WHEN 0 THEN -60.6393
        WHEN 1 THEN -64.1888
        WHEN 2 THEN -68.8458
        WHEN 3 THEN -66.3372
        ELSE -60.0087
    END,
    CURRENT_DATE - INTERVAL '1 day' * (rn % 10)
FROM numbered_drivers d
WHERE rn <= 10;

-- Viajes completados L1 (morado) - 8 viajes
WITH numbered_drivers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn FROM drivers
)
INSERT INTO trips (driver_id, loading_location, unloading_location, date, client_name, product, status, line, unloading_address, unloading_lat, unloading_lng, completed_at)
SELECT 
    d.id,
    'Buenos Aires, Argentina',
    CASE (rn - 10) % 4
        WHEN 0 THEN 'La Plata, Buenos Aires'
        WHEN 1 THEN 'Mar del Plata, Buenos Aires'
        WHEN 2 THEN 'Bahía Blanca, Buenos Aires'
        ELSE 'San Nicolás, Buenos Aires'
    END,
    CURRENT_DATE - INTERVAL '1 day' * ((rn - 10) % 7 + 1),
    'GBE',
    CASE (rn - 10) % 4
        WHEN 0 THEN 'Sebo'
        WHEN 1 THEN 'Ac Grasos'
        WHEN 2 THEN 'Esterificados'
        ELSE 'Borra'
    END,
    'completado_l1',
    'L1',
    CASE (rn - 10) % 4
        WHEN 0 THEN 'La Plata, Buenos Aires, Argentina'
        WHEN 1 THEN 'Mar del Plata, Buenos Aires, Argentina'
        WHEN 2 THEN 'Bahía Blanca, Buenos Aires, Argentina'
        ELSE 'San Nicolás, Buenos Aires, Argentina'
    END,
    CASE (rn - 10) % 4
        WHEN 0 THEN -34.9215
        WHEN 1 THEN -38.0055
        WHEN 2 THEN -38.7183
        ELSE -33.3569
    END,
    CASE (rn - 10) % 4
        WHEN 0 THEN -57.9545
        WHEN 1 THEN -57.5426
        WHEN 2 THEN -62.2663
        ELSE -60.2274
    END,
    CURRENT_DATE - INTERVAL '1 day' * ((rn - 10) % 7)
FROM numbered_drivers d
WHERE rn > 10 AND rn <= 18;

-- Viajes pendientes (blanco) - 8 viajes
WITH numbered_drivers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn FROM drivers
)
INSERT INTO trips (driver_id, loading_location, unloading_location, date, client_name, product, status, line)
SELECT 
    d.id,
    'Buenos Aires, Argentina',
    CASE rn % 4
        WHEN 0 THEN 'Tucumán, Tucumán'
        WHEN 1 THEN 'Salta, Salta'
        WHEN 2 THEN 'Santa Fe, Santa Fe'
        ELSE 'Paraná, Entre Ríos'
    END,
    CURRENT_DATE - INTERVAL '1 day' * (rn % 3),
    'GBE',
    CASE rn % 3
        WHEN 0 THEN 'Aceite'
        WHEN 1 THEN 'Combustible'
        ELSE 'Glicerina'
    END,
    'pendiente',
    CASE rn % 2
        WHEN 0 THEN 'L1'
        ELSE 'L2'
    END
FROM numbered_drivers d
WHERE rn <= 8;

-- Viajes cancelados (rojo) - 4 viajes con particularidades
WITH numbered_drivers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn FROM drivers
)
INSERT INTO trips (driver_id, loading_location, unloading_location, date, client_name, product, status, line, has_particularity, particularity_notes)
SELECT 
    d.id,
    'Buenos Aires, Argentina',
    CASE (rn - 8) % 2
        WHEN 0 THEN 'Neuquén, Neuquén'
        ELSE 'Río Cuarto, Córdoba'
    END,
    CURRENT_DATE - INTERVAL '1 day' * ((rn - 8) % 5),
    'GBE',
    CASE (rn - 8) % 2
        WHEN 0 THEN 'Gas Oil'
        ELSE 'Oleina'
    END,
    'cancelado',
    'L2',
    true,
    CASE (rn - 8) % 2
        WHEN 0 THEN 'Cliente canceló el pedido'
        ELSE 'Problema mecánico en el vehículo'
    END
FROM numbered_drivers d
WHERE rn > 8 AND rn <= 12;

-- ============================================
-- MANTENIMIENTOS (algunos ejemplos)
-- ============================================
WITH numbered_vehicles AS (
  SELECT id, kilometers, ROW_NUMBER() OVER (ORDER BY patent_chasis) as rn
  FROM vehicles WHERE vehicle_type = 'Chasis'
)
INSERT INTO maintenances (vehicle_id, description, date, kilometers_at_service, cost, next_service_date, next_service_km)
SELECT 
    id,
    'Cambio de aceite y filtros completo',
    CURRENT_DATE - INTERVAL '30 days',
    kilometers - 15000,
    35000,
    CURRENT_DATE + INTERVAL '150 days',
    kilometers + 10000
FROM numbered_vehicles
WHERE rn <= 5;

WITH numbered_vehicles AS (
  SELECT id, kilometers, ROW_NUMBER() OVER (ORDER BY patent_chasis) as rn
  FROM vehicles WHERE vehicle_type = 'Chasis'
)
INSERT INTO maintenances (vehicle_id, description, date, kilometers_at_service, cost, next_service_date)
SELECT 
    id,
    'Verificación Técnica Vehicular anual',
    CURRENT_DATE - INTERVAL '90 days',
    kilometers - 20000,
    25000,
    CURRENT_DATE + INTERVAL '275 days'
FROM numbered_vehicles
WHERE rn > 5 AND rn <= 8;

-- ============================================
-- REGISTROS DE COMBUSTIBLE (algunos ejemplos)
-- ============================================
WITH numbered_vehicles AS (
  SELECT id, kilometers, ROW_NUMBER() OVER (ORDER BY patent_chasis) as rn
  FROM vehicles WHERE vehicle_type = 'Chasis'
)
INSERT INTO fuel_records (vehicle_id, date, liters, cost, kilometers, station)
SELECT 
    id,
    CURRENT_DATE - INTERVAL '1 day' * (rn % 15),
    350 + (rn % 100),
    (350 + (rn % 100)) * 850,
    kilometers - (rn % 15 * 1000),
    'YPF Ruta 9'
FROM numbered_vehicles
WHERE rn <= 10;

-- ============================================
-- Verificación de datos cargados
-- ============================================
SELECT 'Choferes creados:' as info, COUNT(*)::text as cantidad FROM drivers
UNION ALL
SELECT 'Vehículos Chasis:', COUNT(*)::text FROM vehicles WHERE vehicle_type = 'Chasis'
UNION ALL
SELECT 'Vehículos Semiremolque:', COUNT(*)::text FROM vehicles WHERE vehicle_type = 'Semiremolque'
UNION ALL
SELECT 'Viajes completados L2:', COUNT(*)::text FROM trips WHERE status = 'completado_l2'
UNION ALL
SELECT 'Viajes completados L1:', COUNT(*)::text FROM trips WHERE status = 'completado_l1'
UNION ALL
SELECT 'Viajes pendientes:', COUNT(*)::text FROM trips WHERE status = 'pendiente'
UNION ALL
SELECT 'Viajes cancelados:', COUNT(*)::text FROM trips WHERE status = 'cancelado'
UNION ALL
SELECT 'Total de viajes:', COUNT(*)::text FROM trips;
