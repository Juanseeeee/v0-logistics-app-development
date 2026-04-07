-- Actualización de tipos de documentos según requerimientos
-- Fecha: 2026-02-23

-- 1. EMPRESA
-- Eliminar "Inscripción ARCA"
DELETE FROM document_types 
WHERE name = 'Inscripción ARCA' AND entity_type = 'company';

-- Agregar "Pago F931"
INSERT INTO document_types (name, description, entity_type, renewal_frequency, alert_days_before)
SELECT 'Pago F931', 'Comprobante de pago del Formulario 931', 'company', 'monthly', 10
WHERE NOT EXISTS (
    SELECT 1 FROM document_types WHERE name = 'Pago F931' AND entity_type = 'company'
);

-- 2. VEHÍCULOS
-- Eliminar "ITV"
DELETE FROM document_types 
WHERE name = 'ITV' AND entity_type = 'vehicle';

-- Agregar "Pago seguro RC"
INSERT INTO document_types (name, description, entity_type, renewal_frequency, alert_days_before)
SELECT 'Pago seguro RC', 'Comprobante de pago del Seguro de Responsabilidad Civil', 'vehicle', 'monthly', 10
WHERE NOT EXISTS (
    SELECT 1 FROM document_types WHERE name = 'Pago seguro RC' AND entity_type = 'vehicle'
);

-- Agregar "Cédula Verde"
INSERT INTO document_types (name, description, entity_type, renewal_frequency, alert_days_before)
SELECT 'Cédula Verde', 'Cédula de Identificación del Automotor', 'vehicle', 'custom', 30
WHERE NOT EXISTS (
    SELECT 1 FROM document_types WHERE name = 'Cédula Verde' AND entity_type = 'vehicle'
);

-- 3. CHOFERES
-- Modificar "ART Chofer" por "ART Chofer/Seguro Accidentes Personales"
UPDATE document_types 
SET name = 'ART Chofer/Seguro Accidentes Personales',
    description = 'Certificado de cobertura ART o Seguro de Accidentes Personales'
WHERE name = 'ART Chofer' AND entity_type = 'driver';

-- Modificar "Constancia de AFIP" por "Constancia de AFIP/Alta temprana"
-- Nota: En el seed original se llama "Constancia AFIP"
UPDATE document_types 
SET name = 'Constancia de AFIP/Alta temprana',
    description = 'Constancia de inscripción AFIP o Alta Temprana'
WHERE name = 'Constancia AFIP' AND entity_type = 'driver';
