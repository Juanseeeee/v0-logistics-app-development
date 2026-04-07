-- Agrega fletero a documentos sin romper registros existentes

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS transport_company_id UUID REFERENCES transport_companies(id);

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS transport_company_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_documents_transport_company_id ON documents(transport_company_id);

COMMENT ON COLUMN documents.transport_company_id IS 'Empresa de transporte asociada al documento';
COMMENT ON COLUMN documents.transport_company_name IS 'Nombre del fletero para búsqueda y compatibilidad histórica';

UPDATE documents d
SET transport_company_name = tc.name
FROM transport_companies tc
WHERE d.transport_company_id = tc.id
  AND (d.transport_company_name IS NULL OR d.transport_company_name = '');

DROP VIEW IF EXISTS document_alerts;

CREATE OR REPLACE VIEW document_alerts AS
SELECT
  d.id,
  d.document_type_id,
  dt.name AS document_type_name,
  dt.entity_type,
  d.entity_id,
  d.entity_name,
  d.transport_company_id,
  d.transport_company_name,
  d.file_name,
  d.expiry_date,
  dt.alert_days_before,
  (d.expiry_date - CURRENT_DATE) AS days_until_expiry,
  CASE
    WHEN d.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN d.expiry_date <= CURRENT_DATE + (dt.alert_days_before || ' days')::INTERVAL THEN 'critical'
    WHEN d.expiry_date <= CURRENT_DATE + ((dt.alert_days_before * 2) || ' days')::INTERVAL THEN 'warning'
    ELSE 'ok'
  END AS urgency_level
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
