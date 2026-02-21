-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_type VARCHAR(50) NOT NULL,
  patent_chasis VARCHAR(50) NOT NULL,
  patent_semi VARCHAR(50),
  transport_company VARCHAR(255) NOT NULL,
  kilometers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_types table for predefined maintenance categories
CREATE TABLE IF NOT EXISTS maintenance_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  alert_interval_days INTEGER,
  alert_interval_km INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenances table
CREATE TABLE IF NOT EXISTS maintenances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type_id UUID REFERENCES maintenance_types(id),
  description TEXT NOT NULL,
  cost DECIMAL(10, 2),
  date DATE NOT NULL,
  kilometers_at_service INTEGER,
  next_service_date DATE,
  next_service_km INTEGER,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fuel_records table
CREATE TABLE IF NOT EXISTS fuel_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  liters DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  kilometers INTEGER,
  station VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cuit VARCHAR(20) NOT NULL UNIQUE,
  chasis_id UUID REFERENCES vehicles(id),
  semi_id UUID REFERENCES vehicles(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cuit VARCHAR(20),
  address TEXT,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_number SERIAL,
  date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  line VARCHAR(10) NOT NULL CHECK (line IN ('L1', 'L2')),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  product TEXT NOT NULL,
  loading_location TEXT NOT NULL,
  unloading_location TEXT NOT NULL,
  transport_company VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_alerts view
CREATE OR REPLACE VIEW maintenance_alerts AS
SELECT 
  m.id,
  m.vehicle_id,
  v.patent_chasis,
  v.vehicle_type,
  m.description,
  m.next_service_date,
  m.next_service_km,
  v.kilometers as current_km,
  CASE 
    WHEN m.next_service_date IS NOT NULL AND m.next_service_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'date'
    WHEN m.next_service_km IS NOT NULL AND v.kilometers >= (m.next_service_km - 1000) THEN 'kilometers'
    ELSE NULL
  END as alert_type,
  CASE 
    WHEN m.next_service_date IS NOT NULL THEN (m.next_service_date - CURRENT_DATE)
    ELSE NULL
  END as days_until_service,
  CASE 
    WHEN m.next_service_km IS NOT NULL THEN (m.next_service_km - v.kilometers)
    ELSE NULL
  END as km_until_service
FROM maintenances m
JOIN vehicles v ON m.vehicle_id = v.id
WHERE 
  (m.next_service_date IS NOT NULL AND m.next_service_date <= CURRENT_DATE + INTERVAL '30 days')
  OR
  (m.next_service_km IS NOT NULL AND v.kilometers >= (m.next_service_km - 1000))
ORDER BY 
  COALESCE(m.next_service_date, CURRENT_DATE + INTERVAL '999 days'),
  COALESCE(m.next_service_km, 999999);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_transport ON vehicles(transport_company);
CREATE INDEX IF NOT EXISTS idx_maintenances_vehicle ON maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_next_date ON maintenances(next_service_date);
CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle ON fuel_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(date);
CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(active);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_client ON trips(client_id);
