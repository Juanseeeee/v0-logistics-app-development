-- Auto-confirm users created by administrators
-- This allows admin-created users to login immediately without email confirmation

-- Function to auto-confirm a user by email
CREATE OR REPLACE FUNCTION auth.auto_confirm_user(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
  WHERE email = user_email
    AND email_confirmed_at IS NULL;
END;
$$;

-- Grant execute permission to authenticated users (only admins will call this via RPC)
GRANT EXECUTE ON FUNCTION auth.auto_confirm_user(TEXT) TO authenticated;

-- Comment
COMMENT ON FUNCTION auth.auto_confirm_user IS 'Auto-confirms a user email address, allowing immediate login without email verification';
