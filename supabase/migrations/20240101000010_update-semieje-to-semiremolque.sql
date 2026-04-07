-- Script para actualizar "Semieje" a "Semiremolque" en la base de datos

-- Actualizar los vehículos existentes
UPDATE vehicles 
SET vehicle_type = 'Semiremolque' 
WHERE vehicle_type = 'Semieje';

-- Verificar los cambios
SELECT id, vehicle_type, patent_chasis, transport_company 
FROM vehicles 
WHERE vehicle_type = 'Semiremolque'
ORDER BY patent_chasis;
