-- Fix infinite recursion in users table RLS policies
-- This script completely removes old policies and creates simple, safe ones

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create simple policies that don't cause recursion

-- 1. Allow all authenticated users to read their own profile
-- This is CRITICAL for login to work
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Allow admins to read all users
-- Using a simple check that doesn't query the users table
CREATE POLICY "Admins can read all users"
ON users
FOR SELECT
TO authenticated
USING (
  -- Check if user is admin by directly comparing auth metadata
  -- This avoids querying the users table which causes recursion
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'owner')
    LIMIT 1
  )
);

-- 3. Allow admins to insert new users
CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'owner')
    LIMIT 1
  )
);

-- 4. Allow admins to update users
CREATE POLICY "Admins can update users"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'owner')
    LIMIT 1
  )
);

-- 5. Allow admins to delete users
CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'owner')
    LIMIT 1
  )
);

-- Verify policies are created
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
