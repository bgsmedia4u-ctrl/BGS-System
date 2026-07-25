-- Fix Infinite Recursion in Profiles RLS
-- A self-referential RLS query (checking public.profiles inside a policy on public.profiles) 
-- causes an infinite recursion loop, resulting in a database error when fetching teacher lists.

-- 1. Create a helper function with SECURITY DEFINER to bypass RLS when checking a user's approval status
CREATE OR REPLACE FUNCTION public.is_user_approved()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (status = 'approved' OR role = 'admin')
  );
END;
$$;

-- 2. Drop the buggy recursive policy
DROP POLICY IF EXISTS "Allow users to read own profile and approved users to read all" ON public.profiles;

-- 3. Re-create the policy using the safe helper function
CREATE POLICY "Allow users to read own profile and approved users to read all" 
ON public.profiles FOR SELECT USING (
    auth.uid() = id OR public.is_user_approved()
);
