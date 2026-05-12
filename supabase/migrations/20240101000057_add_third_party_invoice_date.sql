-- Añadir columna para la fecha del comprobante de terceros
ALTER TABLE "public"."l2_trips" ADD COLUMN IF NOT EXISTS "third_party_invoice_date" date;