-- Sistema de Gestión de Documentación

-- Actualizar los roles de usuario para incluir el rol 'documents'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('owner', 'manager', 'documents', 'driver', 'company'));

-- Crear tabla de tipos de documentos
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('company', 'vehicle', 'driver')),
  renewal_frequency VARCHAR(50) CHECK (renewal_frequency IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'biannual', 'custom')),
  renewal_days INTEGER, -- días para renovación (si es custom)
  alert_days_before INTEGER DEFAULT 15, -- días antes del vencimiento para alertar
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de documentos
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('company', 'vehicle', 'driver')),
  entity_id UUID, -- ID de la empresa, vehículo o chofer (puede ser NULL para empresas globales)
  entity_name VARCHAR(255), -- Nombre de la entidad para búsqueda rápida
  file_url TEXT, -- URL del archivo en Blob storage
  file_name VARCHAR(255),
  file_size INTEGER, -- tamaño en bytes
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear vista de alertas de documentos
CREATE OR REPLACE VIEW document_alerts AS
SELECT 
  d.id,
  d.document_type_id,
  dt.name as document_type_name,
  dt.entity_type,
  d.entity_id,
  d.entity_name,
  d.file_name,
  d.expiry_date,
  dt.alert_days_before,
  (d.expiry_date - CURRENT_DATE) as days_until_expiry,
  CASE 
    WHEN d.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN d.expiry_date <= CURRENT_DATE + (dt.alert_days_before || ' days')::INTERVAL THEN 'critical'
    WHEN d.expiry_date <= CURRENT_DATE + ((dt.alert_days_before * 2) || ' days')::INTERVAL THEN 'warning'
    ELSE 'ok'
  END as urgency_level
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.expiry_date IS NOT NULL
  AND d.expiry_date <= CURRENT_DATE + ((dt.alert_days_before * 2) || ' days')::INTERVAL
ORDER BY 
  CASE 
    WHEN d.expiry_date < CURRENT_DATE THEN 0
    WHEN d.expiry_date <= CURRENT_DATE + (dt.alert_days_before || ' days')::INTERVAL THEN 1
    ELSE 2
  END,
  d.expiry_date ASC;

-- Insertar tipos de documentos predefinidos

-- EMPRESA/UNIPERSONALES
INSERT INTO document_types (name, description, entity_type, renewal_frequency, alert_days_before) VALUES
('Constancia ARCA', 'Constancia de inscripción en ARCA', 'company', 'semiannual', 30),
('Alta Temprana Empleados', 'Constancia de alta temprana de empleados', 'company', 'custom', 15),
('ART Cobertura', 'Certificado de cobertura ART con nómina', 'company', 'annual', 30),
('Cláusula No Repetición', 'Cláusula de No Repetición a favor de la empresa', 'company', 'annual', 30),
('Seguro Vida Obligatorio', 'Seguro de Vida Obligatorio', 'company', 'monthly', 15),
('Aportes Sindicales', 'Comprobante de aportes sindicales', 'company', 'monthly', 10),
('F.931', 'Formulario F.931 - Nómina AFIP', 'company', 'monthly', 10),
('Recibo de Sueldo', 'Comprobante de pago de remuneraciones', 'company', 'monthly', 10),
('Datos Bancarios', 'Datos bancarios: CBU, cuenta, entidad', 'company', 'custom', 30),
('Inscripción ARCA', 'Inscripción en ARCA (Unipersonal)', 'company', 'annual', 30),
('Pago Autónomo', 'Comprobante de pago autónomo o monotributo', 'company', 'monthly', 10),
('Seguro Accidentes Personales', 'Seguro de accidentes personales', 'company', 'annual', 30);

-- UNIDAD (VEHÍCULOS)
INSERT INTO document_types (name, description, entity_type, renewal_frequency, alert_days_before) VALUES
('Seguro Responsabilidad Civil', 'Seguro de Responsabilidad Civil Automotor - Póliza', 'vehicle', 'monthly', 15),
('VTV', 'Revisión Técnica Vehicular', 'vehicle', 'semiannual', 30),
('ITV', 'Inspección Técnica Vehicular', 'vehicle', 'semiannual', 30),
('RTO', 'Revisión Técnica Obligatoria', 'vehicle', 'annual', 30),
('Título de Propiedad', 'Título de Propiedad o Cédula Verde', 'vehicle', 'custom', 30),
('Sistema Satelital', 'Certificado de Sistema Satelital', 'vehicle', 'annual', 30);

-- CHOFER
INSERT INTO document_types (name, description, entity_type, renewal_frequency, alert_days_before) VALUES
('ART Chofer', 'Certificado de cobertura ART del chofer', 'driver', 'annual', 30),
('DNI', 'Documento Nacional de Identidad', 'driver', 'custom', 90),
('Constancia CUIL', 'Constancia de CUIL', 'driver', 'custom', 30),
('Registro de Conducir', 'Registro de conducir con categoría correspondiente', 'driver', 'annual', 60),
('Constancia AFIP', 'Constancia AFIP (Alta/Baja del empleado)', 'driver', 'custom', 30),
('Apto Médico', 'Certificado de aptitud médica', 'driver', 'annual', 60);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_document_types_entity ON document_types(entity_type);

-- Habilitar RLS en las tablas de documentos
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para documents
CREATE POLICY "Authenticated users can view documents" ON documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert documents" ON documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents" ON documents
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents" ON documents
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para document_types
CREATE POLICY "Anyone can view document types" ON document_types
  FOR SELECT USING (true);
