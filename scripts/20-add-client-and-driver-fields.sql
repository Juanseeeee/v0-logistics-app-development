-- Agregar campos de contacto comercial y logístico a clientes
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS commercial_contact_name VARCHAR,
ADD COLUMN IF NOT EXISTS commercial_contact_phone VARCHAR,
ADD COLUMN IF NOT EXISTS logistics_contact_name VARCHAR,
ADD COLUMN IF NOT EXISTS logistics_contact_phone VARCHAR;

-- Agregar campo transporte a choferes
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS transport_company VARCHAR;

COMMENT ON COLUMN clients.commercial_contact_name IS 'Nombre del contacto comercial (opcional)';
COMMENT ON COLUMN clients.commercial_contact_phone IS 'Teléfono del contacto comercial (opcional)';
COMMENT ON COLUMN clients.logistics_contact_name IS 'Nombre del contacto logístico (opcional)';
COMMENT ON COLUMN clients.logistics_contact_phone IS 'Teléfono del contacto logístico (opcional)';
COMMENT ON COLUMN drivers.transport_company IS 'Empresa de transporte del chofer (opcional)';
