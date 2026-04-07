-- Crear tabla de empresas de transporte
CREATE TABLE IF NOT EXISTS transport_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  cuit VARCHAR,
  address TEXT,
  contact_name VARCHAR,
  contact_phone VARCHAR,
  contact_email VARCHAR,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrar datos existentes: crear empresas únicas desde drivers
INSERT INTO transport_companies (name)
SELECT DISTINCT transport_company
FROM drivers
WHERE transport_company IS NOT NULL 
  AND transport_company != ''
  AND transport_company != '.NULL.'
ON CONFLICT (name) DO NOTHING;

-- Migrar datos existentes: crear empresas únicas desde vehicles
INSERT INTO transport_companies (name)
SELECT DISTINCT transport_company
FROM vehicles
WHERE transport_company IS NOT NULL 
  AND transport_company != ''
  AND transport_company != '.NULL.'
  AND transport_company NOT IN (SELECT name FROM transport_companies)
ON CONFLICT (name) DO NOTHING;

-- Agregar columna transport_company_id a drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS transport_company_id UUID REFERENCES transport_companies(id);

-- Actualizar drivers con los IDs de las empresas migradas
UPDATE drivers d
SET transport_company_id = tc.id
FROM transport_companies tc
WHERE d.transport_company = tc.name
  AND d.transport_company IS NOT NULL
  AND d.transport_company != ''
  AND d.transport_company != '.NULL.';

-- Agregar columna transport_company_id a vehicles  
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transport_company_id UUID REFERENCES transport_companies(id);

-- Actualizar vehicles con los IDs de las empresas migradas
UPDATE vehicles v
SET transport_company_id = tc.id
FROM transport_companies tc
WHERE v.transport_company = tc.name
  AND v.transport_company IS NOT NULL
  AND v.transport_company != ''
  AND v.transport_company != '.NULL.';

-- Habilitar RLS en transport_companies
ALTER TABLE transport_companies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view transport companies"
  ON transport_companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transport companies"
  ON transport_companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transport companies"
  ON transport_companies FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete transport companies"
  ON transport_companies FOR DELETE
  TO authenticated
  USING (true);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_drivers_transport_company_id ON drivers(transport_company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_transport_company_id ON vehicles(transport_company_id);
CREATE INDEX IF NOT EXISTS idx_transport_companies_name ON transport_companies(name);

COMMENT ON TABLE transport_companies IS 'Empresas de transporte disponibles en el sistema';
COMMENT ON COLUMN drivers.transport_company_id IS 'Referencia a la empresa de transporte del chofer';
COMMENT ON COLUMN vehicles.transport_company_id IS 'Referencia a la empresa de transporte del vehículo';
