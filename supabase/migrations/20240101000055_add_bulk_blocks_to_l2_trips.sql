-- Añadir columnas para agrupar viajes en bloques de facturación y liquidación
ALTER TABLE "public"."l2_trips" ADD COLUMN IF NOT EXISTS "bulk_billing_id" uuid;
ALTER TABLE "public"."l2_trips" ADD COLUMN IF NOT EXISTS "bulk_settlement_id" uuid;
