-- Actualizar la tabla users para agregar nuevos roles
-- Los roles existentes: admin, owner, manager, documents, driver, company
-- Nuevos roles: trip_manager (encargado de viajes), reporter (gestor)

-- Actualizar constraint de roles si existe
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Agregar nuevo constraint con todos los roles permitidos
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'owner', 'manager', 'trip_manager', 'reporter', 'documents', 'driver', 'company'));

-- RLS políticas para users (solo admins pueden gestionar usuarios)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Crear políticas para gestión de usuarios por admins
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
