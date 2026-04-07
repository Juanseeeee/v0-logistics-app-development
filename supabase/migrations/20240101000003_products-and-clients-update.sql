-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_products junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS client_products (
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (client_id, product_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify clients table to add new fields
ALTER TABLE clients 
  RENAME COLUMN name TO company;

ALTER TABLE clients 
  RENAME COLUMN address TO location;

ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS responsibles TEXT,
  ADD COLUMN IF NOT EXISTS comments TEXT;

-- Insert initial products
INSERT INTO products (name, description) VALUES
  ('Aceite', 'Aceite para transporte'),
  ('Combustible', 'Combustible'),
  ('Glicerina', 'Glicerina'),
  ('Borra', 'Borra'),
  ('Efluente', 'Efluente'),
  ('Gomas', 'Gomas'),
  ('Ac Grasos', 'Ácidos grasos'),
  ('Esterificados', 'Esterificados'),
  ('Gas Oil', 'Gas Oil'),
  ('Oleina', 'Oleina'),
  ('Sebo', 'Sebo')
ON CONFLICT (name) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_client_products_client ON client_products(client_id);
CREATE INDEX IF NOT EXISTS idx_client_products_product ON client_products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
