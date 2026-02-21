-- Crear usuarios de prueba para diferentes roles
-- IMPORTANTE: Estos usuarios deben crearse primero en Supabase Auth y luego vincularlos aquí

-- Primero, eliminar cualquier dato de prueba existente en la tabla users
DELETE FROM users WHERE email LIKE '%@test-cronos.com';

-- Usuarios de prueba (los UUIDs deben reemplazarse con los IDs reales de auth.users después de crear las cuentas)
-- Por ahora, insertamos registros con emails para que el sistema pueda encontrarlos

-- NOTA: Para crear estos usuarios, ejecuta estos comandos en la consola de Supabase o a través de la API:
-- 1. Admin: admin@cronos.com / Cronos2024!
-- 2. Manager: manager@cronos.com / Cronos2024!
-- 3. Documentación: docs@cronos.com / Cronos2024!
-- 4. Chofer: driver@cronos.com / Cronos2024!
-- 5. Empresa: company@cronos.com / Cronos2024!

-- Script para insertar usuarios después de crearlos en Supabase Auth
-- Reemplaza los UUIDs con los IDs reales de auth.users

INSERT INTO users (id, email, role, created_at) 
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.email = 'admin@cronos.com' THEN 'owner'
    WHEN au.email = 'manager@cronos.com' THEN 'manager'
    WHEN au.email = 'docs@cronos.com' THEN 'documents'
    WHEN au.email = 'driver@cronos.com' THEN 'driver'
    WHEN au.email = 'company@cronos.com' THEN 'company'
  END as role,
  NOW()
FROM auth.users au
WHERE au.email IN (
  'admin@cronos.com',
  'manager@cronos.com', 
  'docs@cronos.com',
  'driver@cronos.com',
  'company@cronos.com'
)
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verificar que los usuarios se crearon correctamente
SELECT email, role FROM users WHERE email LIKE '%@cronos.com';
