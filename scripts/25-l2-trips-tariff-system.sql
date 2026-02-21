-- Sistema de viajes L2 y tarifario
-- Tabla para tarifas de viajes L2
CREATE TABLE IF NOT EXISTS l2_tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  rate_per_ton DECIMAL(10, 2),
  rate_per_trip DECIMAL(10, 2),
  transport_company VARCHAR(255),
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para viajes L2 completos
CREATE TABLE IF NOT EXISTS l2_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50),
  invoice_date DATE,
  payment_date DATE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Datos de carga
  origin VARCHAR(255) NOT NULL,
  origin_company VARCHAR(255),
  
  -- Datos de descarga
  destination VARCHAR(255) NOT NULL,
  destination_company VARCHAR(255),
  
  -- Pesos
  tare_origin DECIMAL(10, 2),
  gross_weight DECIMAL(10, 2),
  net_origin DECIMAL(10, 2),
  tare_destination DECIMAL(10, 2),
  net_destination DECIMAL(10, 2),
  weight_difference DECIMAL(10, 2),
  tons_delivered DECIMAL(10, 2),
  
  -- Chofer y vehículos
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  chasis_patent VARCHAR(50),
  semi_patent VARCHAR(50),
  
  -- Tarifas y montos
  tariff_rate DECIMAL(10, 2),
  trip_amount DECIMAL(10, 2),
  
  -- Transporte terceros
  third_party_transport VARCHAR(255),
  third_party_rate DECIMAL(10, 2),
  third_party_amount DECIMAL(10, 2),
  third_party_invoice VARCHAR(50),
  third_party_payment_date DATE,
  third_party_payment_status VARCHAR(50) DEFAULT 'PENDIENTE',
  
  -- Estados cliente
  client_invoice_passed BOOLEAN DEFAULT false,
  client_invoice_number VARCHAR(50),
  client_invoice_date DATE,
  client_payment_date DATE,
  client_fca_number VARCHAR(50),
  client_payment_status VARCHAR(50) DEFAULT 'PENDIENTE',
  
  year INTEGER,
  category VARCHAR(50) DEFAULT 'Tercero',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_l2_trips_client ON l2_trips(client_id);
CREATE INDEX IF NOT EXISTS idx_l2_trips_driver ON l2_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_l2_trips_invoice_date ON l2_trips(invoice_date);
CREATE INDEX IF NOT EXISTS idx_l2_trips_payment_status ON l2_trips(client_payment_status, third_party_payment_status);
CREATE INDEX IF NOT EXISTS idx_l2_tariffs_client ON l2_tariffs(client_id);
CREATE INDEX IF NOT EXISTS idx_l2_tariffs_active ON l2_tariffs(active);

-- RLS Policies
ALTER TABLE l2_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE l2_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on l2_tariffs for authenticated users"
  ON l2_tariffs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on l2_trips for authenticated users"
  ON l2_trips FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
