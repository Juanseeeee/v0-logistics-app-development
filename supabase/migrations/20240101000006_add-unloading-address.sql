-- Add address field for unloading location
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS unloading_address TEXT;

-- Add completed_at timestamp to track when trip was marked as completed
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Update existing completed trips to use updated_at as completed_at
UPDATE trips
SET completed_at = updated_at
WHERE status = 'completado' AND completed_at IS NULL;
