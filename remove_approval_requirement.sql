-- =================================================================
-- REMOVE ADMIN APPROVAL FOR REGISTRATION AND SIGN-IN FOREVER
-- =================================================================

-- 1. Change the default database column setting from 'pending' to 'approved'
ALTER TABLE public.profiles 
ALTER COLUMN status SET DEFAULT 'approved';

-- 2. Update every single existing user in the database so nobody is stuck in 'pending' or 'rejected'
UPDATE public.profiles 
SET status = 'approved' 
WHERE status IS NULL OR status IN ('pending', 'rejected');

-- 3. Ensure the signup trigger automatically assigns 'approved' immediately upon registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'teacher',
    'approved', -- Auto-approved immediately!
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verify trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
