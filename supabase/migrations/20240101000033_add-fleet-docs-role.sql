-- Add fleet_docs role to the users table check constraint
-- This role allows access to both Fleet management and Documents modules

-- Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new check constraint with fleet_docs role included
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'owner', 'manager', 'trip_manager', 'reporter', 'documents', 'fleet_docs', 'driver', 'company'));
