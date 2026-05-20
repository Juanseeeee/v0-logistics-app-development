-- Update document_alerts view to only include active entities and non-archived documents, using fixed alert days (15/30)

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
    WHEN d.expiry_date <= CURRENT_DATE + interval '15 days' THEN 'critical'
    WHEN d.expiry_date <= CURRENT_DATE + interval '30 days' THEN 'warning'
    ELSE 'ok'
  END AS urgency_level
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
LEFT JOIN vehicles v ON d.entity_id::text = v.id::text AND dt.entity_type = 'vehicle'
LEFT JOIN drivers dr ON d.entity_id::text = dr.id::text AND dt.entity_type = 'driver'
LEFT JOIN transport_companies tc ON d.entity_id::text = tc.id::text AND dt.entity_type = 'transport_company'
WHERE d.expiry_date IS NOT NULL
  AND (
    (dt.entity_type = 'vehicle') OR
    (dt.entity_type = 'driver' AND (dr.active = true OR d.entity_id IS NULL)) OR
    (dt.entity_type = 'transport_company' AND (tc.active = true OR d.entity_id IS NULL)) OR
    (dt.entity_type NOT IN ('vehicle', 'driver', 'transport_company'))
  )
  AND d.expiry_date <= CURRENT_DATE + interval '30 days'
ORDER BY
  CASE
    WHEN d.expiry_date < CURRENT_DATE THEN 0
    WHEN d.expiry_date <= CURRENT_DATE + interval '15 days' THEN 1
    ELSE 2
  END,
  d.expiry_date ASC;

-- Ensure the view has security invoker enabled
ALTER VIEW document_alerts SET (security_invoker = true);
