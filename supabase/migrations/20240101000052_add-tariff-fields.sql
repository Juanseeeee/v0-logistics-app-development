-- Add observations and kilometers columns to l2_tariffs
ALTER TABLE l2_tariffs ADD COLUMN IF NOT EXISTS observations text;
ALTER TABLE l2_tariffs ADD COLUMN IF NOT EXISTS kilometers numeric;
