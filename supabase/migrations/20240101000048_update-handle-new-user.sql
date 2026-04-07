-- Actualizar handle_new_user para respetar el rol si viene en raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Admin'),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;