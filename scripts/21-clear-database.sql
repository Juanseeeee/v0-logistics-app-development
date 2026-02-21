-- Script para limpiar/vaciar todas las tablas de la base de datos
-- ADVERTENCIA: Esto eliminará TODOS los datos excepto los usuarios

-- Eliminar todos los registros de las tablas en el orden correcto para respetar las foreign keys
DELETE FROM trip_drivers;
DELETE FROM trip_vehicles;
DELETE FROM trips;
DELETE FROM fuel_records;
DELETE FROM maintenance_records;
DELETE FROM documents;
DELETE FROM document_alerts;
DELETE FROM drivers;
DELETE FROM vehicles;
DELETE FROM products;
DELETE FROM clients;

-- Resetear las secuencias si las hubiera (opcional)
-- ALTER SEQUENCE IF EXISTS clients_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS vehicles_id_seq RESTART WITH 1;
-- etc...

-- Los usuarios NO se eliminan para mantener el acceso al sistema
