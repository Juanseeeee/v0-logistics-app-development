-- Solución para recursión infinita en políticas RLS de users
-- El problema: Las políticas hacían SELECT en users para verificar roles,
-- lo cual causa recursión infinita.

-- Solución: Eliminar las políticas problemáticas y crear nuevas más simples

-- Primero eliminar todas las políticas existentes de users
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Crear una función que verifica el rol sin causar recursión
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas nuevas sin recursión
-- Los usuarios pueden ver su propia información
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Solo admins pueden ver todos los usuarios (usando función SECURITY DEFINER)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Solo admins pueden insertar usuarios
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Solo admins pueden actualizar usuarios
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Solo admins pueden eliminar usuarios
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE
  TO authenticated
  USING (is_admin());
