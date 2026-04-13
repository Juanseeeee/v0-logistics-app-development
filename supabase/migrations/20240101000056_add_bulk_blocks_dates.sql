-- Añadir columnas para guardar la fecha de creación de los bloques
ALTER TABLE "public"."l2_trips" ADD COLUMN IF NOT EXISTS "bulk_billing_date" TIMESTAMPTZ;
ALTER TABLE "public"."l2_trips" ADD COLUMN IF NOT EXISTS "bulk_settlement_date" TIMESTAMPTZ;