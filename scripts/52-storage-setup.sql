-- Enable Storage by creating the 'documents' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Helper function to check if user is admin/staff
-- (Not creating a function to avoid complexity, using direct checks)

-- INSERT Policy
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' 
    AND (
      -- Admin/Staff can upload anywhere
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
      )
      OR
      -- Users can upload to their own folder (folder name = user_id)
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- SELECT Policy
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      -- Admin/Staff can view all
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
      )
      OR
      -- Users can view their own folder
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- UPDATE Policy
CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
      )
      OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- DELETE Policy
CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'documents', 'fleet_docs')
      )
      OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );
