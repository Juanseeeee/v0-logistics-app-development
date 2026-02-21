-- Add additional columns to fuel_records table for bulk import
ALTER TABLE fuel_records
ADD COLUMN IF NOT EXISTS establishment VARCHAR,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS locality VARCHAR,
ADD COLUMN IF NOT EXISTS province VARCHAR,
ADD COLUMN IF NOT EXISTS driver_name VARCHAR,
ADD COLUMN IF NOT EXISTS vehicle_patent VARCHAR,
ADD COLUMN IF NOT EXISTS odometer INTEGER,
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR,
ADD COLUMN IF NOT EXISTS product_type VARCHAR,
ADD COLUMN IF NOT EXISTS price_per_liter NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS iva NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR,
ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle_patent ON fuel_records(vehicle_patent);
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(date);
CREATE INDEX IF NOT EXISTS idx_fuel_records_import_batch ON fuel_records(import_batch_id);

COMMENT ON COLUMN fuel_records.establishment IS 'Nombre de la estación de servicio';
COMMENT ON COLUMN fuel_records.address IS 'Dirección de la estación';
COMMENT ON COLUMN fuel_records.locality IS 'Localidad de la estación';
COMMENT ON COLUMN fuel_records.province IS 'Provincia de la estación';
COMMENT ON COLUMN fuel_records.driver_name IS 'Nombre del conductor que cargó';
COMMENT ON COLUMN fuel_records.vehicle_patent IS 'Patente del vehículo';
COMMENT ON COLUMN fuel_records.odometer IS 'Lectura del odómetro/cuentakilómetros';
COMMENT ON COLUMN fuel_records.receipt_number IS 'Número de remito';
COMMENT ON COLUMN fuel_records.product_type IS 'Tipo de producto (Infinia nafta, diesel, etc)';
COMMENT ON COLUMN fuel_records.price_per_liter IS 'Precio por litro PVP';
COMMENT ON COLUMN fuel_records.total_amount IS 'Importe total de la carga';
COMMENT ON COLUMN fuel_records.iva IS 'Monto de IVA';
COMMENT ON COLUMN fuel_records.invoice_number IS 'Número de factura';
COMMENT ON COLUMN fuel_records.import_batch_id IS 'ID del lote de importación masiva';
