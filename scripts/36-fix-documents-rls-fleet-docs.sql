-- Fix RLS policies on documents table to include fleet_docs role
-- The fleet_docs role needs the same access as documents role

DROP POLICY IF EXISTS "Users can view their own company documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own company documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own company documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own company documents" ON documents;

-- SELECT: Admins, owners, managers, documents, and fleet_docs can view all; company/driver see own
CREATE POLICY "Users can view their own company documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
    )
    OR
    (company_user_id = auth.uid())
  );

-- INSERT: Same roles can insert any document; company/driver only their own
CREATE POLICY "Users can insert their own company documents" ON documents
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
      )
      OR
      (company_user_id = auth.uid())
    )
  );

-- UPDATE: Same roles can update any document; company/driver only their own
CREATE POLICY "Users can update their own company documents" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
    )
    OR
    (company_user_id = auth.uid())
  );

-- DELETE: Same roles can delete any document; company/driver only their own
CREATE POLICY "Users can delete their own company documents" ON documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
    )
    OR
    (company_user_id = auth.uid())
  );
