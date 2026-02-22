-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Vehicles policies
CREATE POLICY "Authenticated users can view all vehicles" ON vehicles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicles" ON vehicles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicles" ON vehicles
  FOR DELETE USING (auth.role() = 'authenticated');

-- Maintenance types policies
CREATE POLICY "Authenticated users can view maintenance types" ON maintenance_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert maintenance types" ON maintenance_types
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Maintenances policies
CREATE POLICY "Authenticated users can view all maintenances" ON maintenances
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert maintenances" ON maintenances
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update maintenances" ON maintenances
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete maintenances" ON maintenances
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fuel records policies
CREATE POLICY "Authenticated users can view fuel records" ON fuel_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert fuel records" ON fuel_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update fuel records" ON fuel_records
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete fuel records" ON fuel_records
  FOR DELETE USING (auth.role() = 'authenticated');

-- Drivers policies
CREATE POLICY "Authenticated users can view drivers" ON drivers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert drivers" ON drivers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update drivers" ON drivers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete drivers" ON drivers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Clients policies
CREATE POLICY "Authenticated users can view clients" ON clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" ON clients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients" ON clients
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trips policies
CREATE POLICY "Authenticated users can view trips" ON trips
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert trips" ON trips
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update trips" ON trips
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete trips" ON trips
  FOR DELETE USING (auth.role() = 'authenticated');
