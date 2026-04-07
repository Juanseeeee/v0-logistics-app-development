-- Fix driver document visibility and permissions

-- 1. Ensure the document_alerts view respects Row Level Security (RLS)
-- This prevents drivers from seeing alerts for documents they don't own
ALTER VIEW document_alerts OWNER TO postgres; -- Ensure owner is correct (optional but good practice)
ALTER VIEW document_alerts SET (security_invoker = true);

-- 2. Drop any potentially lingering permissive policies from initial setup
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;

-- 3. Re-apply restrictive policies to ensure drivers can only access their own documents
-- (This duplicates logic from script 36 but ensures it's applied and covers drivers via company_user_id)

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
