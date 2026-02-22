-- Script para agregar campos adicionales a la tabla clients
-- Fecha: 2025

-- Agregar nuevos campos a la tabla clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS sale_condition VARCHAR(100),
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'CUIT',
ADD COLUMN IF NOT EXISTS taxpayer_type VARCHAR(50);

-- Agregar comentarios a las columnas
COMMENT ON COLUMN clients.address IS 'Dirección del cliente';
COMMENT ON COLUMN clients.sale_condition IS 'Condición de venta (Contado, 30 días, etc)';
COMMENT ON COLUMN clients.document_type IS 'Tipo de documento (CUIT, DNI, etc)';
COMMENT ON COLUMN clients.taxpayer_type IS 'Tipo de responsable (RI, Monotributista, etc)';
