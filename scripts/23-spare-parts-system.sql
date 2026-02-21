-- Crear tabla de repuestos
CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10, 2),
  location VARCHAR(255),
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla intermedia para vincular mantenimientos con repuestos
CREATE TABLE IF NOT EXISTS maintenance_spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES maintenances(id) ON DELETE CASCADE,
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  quantity_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(maintenance_id, spare_part_id)
);

-- Agregar columna para indicar si un mantenimiento usó repuestos propios
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS uses_own_spare_parts BOOLEAN DEFAULT FALSE;

-- RLS policies para repuestos
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view spare parts"
  ON spare_parts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert spare parts"
  ON spare_parts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update spare parts"
  ON spare_parts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete spare parts"
  ON spare_parts FOR DELETE
  TO authenticated
  USING (true);

-- RLS policies para maintenance_spare_parts
ALTER TABLE maintenance_spare_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view maintenance spare parts"
  ON maintenance_spare_parts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance spare parts"
  ON maintenance_spare_parts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete maintenance spare parts"
  ON maintenance_spare_parts FOR DELETE
  TO authenticated
  USING (true);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_spare_parts_name ON spare_parts(name);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_parts_maintenance ON maintenance_spare_parts(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_parts_spare_part ON maintenance_spare_parts(spare_part_id);
