-- Add user_id to drivers table to link with auth.users
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add unique constraint to user_id to ensure one-to-one relationship
ALTER TABLE drivers 
ADD CONSTRAINT drivers_user_id_key UNIQUE (user_id);

-- Add must_change_password to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Update RLS for drivers
-- First, drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Authenticated users can view drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can insert drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can update drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can delete drivers" ON drivers;

-- Re-create policies with better granularity
-- VIEW: Drivers can see their own profile. Admins/Managers can see all.
CREATE POLICY "Drivers can view their own profile" ON drivers
  FOR SELECT USING (
    auth.uid() = user_id
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'trip_manager', 'reporter', 'documents', 'fleet_docs')
    )
  );

-- INSERT/UPDATE/DELETE: Only Admins/Managers (same as before effectively, but explicit)
CREATE POLICY "Admins and Managers can manage drivers" ON drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager')
    )
  );

-- Update RLS for documents to allow drivers to view their own documents
-- We need to check if the document belongs to the driver
-- The document has entity_type = 'driver' and entity_id = driver.id
-- And the driver has user_id = auth.uid()

DROP POLICY IF EXISTS "Users can view their own company documents" ON documents;
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (
    -- Admin roles can view all
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
    )
    OR
    -- Company users can view their company documents (legacy logic preserved)
    (company_user_id = auth.uid())
    OR
    -- Drivers can view their own documents
    (
      entity_type = 'driver' 
      AND 
      entity_id IN (
        SELECT id FROM drivers WHERE user_id = auth.uid()
      )
    )
  );

-- Allow drivers to insert/upload their own documents?
-- User requirement: "subir y acceder solo a su documentacion"
DROP POLICY IF EXISTS "Users can insert their own company documents" ON documents;
CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND
    (
      -- Admin roles
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
      )
      OR
      -- Company users
      (company_user_id = auth.uid())
      OR
      -- Drivers (can upload for themselves)
      (
        entity_type = 'driver' 
        AND 
        entity_id IN (
          SELECT id FROM drivers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Allow drivers to delete their own documents? (Maybe better not, but for consistency with requirement "subir y acceder")
-- Let's stick to View and Insert for now as per "subir y acceder". 
-- Usually users shouldn't delete audit/compliance docs easily, but let's allow it if they uploaded it? 
-- The previous policy allowed company/driver to delete "their own company documents".
-- Let's update DELETE and UPDATE too.

DROP POLICY IF EXISTS "Users can update their own company documents" ON documents;
CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
    )
    OR
    (company_user_id = auth.uid())
    OR
    (
      entity_type = 'driver' 
      AND 
      entity_id IN (
        SELECT id FROM drivers WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete their own company documents" ON documents;
CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
    )
    OR
    (company_user_id = auth.uid())
    OR
    (
      entity_type = 'driver' 
      AND 
      entity_id IN (
        SELECT id FROM drivers WHERE user_id = auth.uid()
      )
    )
  );
