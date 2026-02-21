-- Insert default maintenance types
INSERT INTO maintenance_types (name, description, alert_interval_days, alert_interval_km) VALUES
('VTV', 'Verificación Técnica Vehicular', 365, NULL),
('Cambio de Aceite', 'Cambio de aceite de motor', NULL, 10000),
('Cambio de Vujes', 'Cambio de vujes', 30, NULL),
('Revisión de Frenos', 'Revisión y mantenimiento de frenos', 180, 20000),
('Revisión de Neumáticos', 'Control y rotación de neumáticos', 90, 15000),
('Filtros', 'Cambio de filtros de aire, combustible, aceite', NULL, 10000),
('Revisión General', 'Revisión general del vehículo', 180, 30000)
ON CONFLICT DO NOTHING;

-- Insert default vehicles
-- Updated Semieje to Semiremolque
INSERT INTO vehicles (vehicle_type, patent_chasis, patent_semi, transport_company, kilometers) VALUES
('Semiremolque', 'AB123CD', 'EF456GH', 'Cronos Logística', 50000),
('Cisterna', 'IJ789KL', 'MN012OP', 'Cronos Logística', 75000),
('Camioneta', 'QR345ST', NULL, 'Cronos Logística', 30000)
ON CONFLICT DO NOTHING;
