-- Agregar columna para vincular documentos con usuarios/empresas
ALTER TABLE documents ADD COLUMN IF NOT EXISTS company_user_id UUID REFERENCES users(id);

-- Actualizar políticas RLS para documentos
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;

-- Políticas nuevas: Los usuarios "company" solo ven sus propios documentos
CREATE POLICY "Users can view their own company documents" ON documents
  FOR SELECT USING (
    -- Admins, owners, managers y documents pueden ver todo
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'documents')
    )
    OR
    -- Usuarios "company" solo ven sus propios documentos
    (company_user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own company documents" ON documents
  FOR INSERT WITH CHECK (
    -- Solo usuarios autenticados pueden insertar
    auth.role() = 'authenticated'
    AND
    -- Si es "company", debe ser su propio documento
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'owner', 'manager', 'documents')
      )
      OR
      (company_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own company documents" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'documents')
    )
    OR
    (company_user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own company documents" ON documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'owner', 'manager', 'documents')
    )
    OR
    (company_user_id = auth.uid())
  );

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_documents_company_user ON documents(company_user_id);
