-- Establecer security_invoker = true para la vista document_alerts
-- Esto permite que la vista herede las políticas de RLS de la tabla documents subyacente
-- asegurando que los choferes solo vean las alertas de sus propios documentos.

ALTER VIEW document_alerts SET (security_invoker = true);
