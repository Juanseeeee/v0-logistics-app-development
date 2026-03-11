-- Update check constraint for bulk_operations_logs to allow 'bulk_edit'

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE bulk_operations_logs DROP CONSTRAINT IF EXISTS bulk_operations_logs_operation_type_check;

    -- Add the new constraint with 'bulk_edit' included
    ALTER TABLE bulk_operations_logs 
    ADD CONSTRAINT bulk_operations_logs_operation_type_check 
    CHECK (operation_type IN ('billing', 'settlement', 'bulk_edit'));
END $$;
