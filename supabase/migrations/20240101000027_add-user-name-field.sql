-- Agregar campo name opcional a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Comentar el propósito de la columna
COMMENT ON COLUMN users.name IS 'Nombre opcional del usuario para mejor identificación';
