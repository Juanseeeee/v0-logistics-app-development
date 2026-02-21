-- Script para asignar roles a usuarios ya creados en Supabase Auth
-- IMPORTANTE: Primero debes crear los usuarios desde el Dashboard de Supabase

-- PASO 1: Crear los usuarios desde el Dashboard de Supabase
-- Ve a: Authentication → Users → Add User
-- 
-- Crear estos 4 usuarios:
--   1. admin@cronos.com (password: Admin123!) - marcar "Auto Confirm"
--   2. documents@cronos.com (password: Docs123!) - marcar "Auto Confirm"
--   3. chofer@cronos.com (password: Chofer123!) - marcar "Auto Confirm"
--   4. empresa@cronos.com (password: Empresa123!) - marcar "Auto Confirm"

-- PASO 2: Ejecutar este script para asignar los roles

-- Usuario Admin (Owner) - Acceso completo
INSERT INTO public.users (id, email, role, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@cronos.com'),
  'admin@cronos.com',
  'owner',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET role = 'owner';

-- Usuario Documentación - Solo acceso a documentación
INSERT INTO public.users (id, email, role, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'documents@cronos.com'),
  'documents@cronos.com',
  'documents',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET role = 'documents';

-- Usuario Chofer - Vista limitada de documentación para choferes
INSERT INTO public.users (id, email, role, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'chofer@cronos.com'),
  'chofer@cronos.com',
  'driver',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET role = 'driver';

-- Usuario Empresa - Vista limitada de documentación para empresas
INSERT INTO public.users (id, email, role, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'empresa@cronos.com'),
  'empresa@cronos.com',
  'company',
  NOW()
) ON CONFLICT (id) DO UPDATE
SET role = 'company';

-- Verificar que los usuarios se crearon correctamente
SELECT u.id, u.email, u.role, u.created_at
FROM public.users u
ORDER BY u.created_at DESC;
