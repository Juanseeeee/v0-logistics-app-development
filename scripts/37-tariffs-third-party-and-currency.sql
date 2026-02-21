-- Add third-party rate columns and currency to l2_tariffs
ALTER TABLE l2_tariffs
  ADD COLUMN IF NOT EXISTS third_party_rate_per_trip DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS third_party_rate_per_ton DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ARS';
