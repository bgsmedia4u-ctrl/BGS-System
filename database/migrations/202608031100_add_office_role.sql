-- Drop the existing role check constraint that restricts to ('teacher', 'admin')
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add a new check constraint that allows 'office' as well
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('teacher', 'admin', 'office'));

-- If the employees table also has a role column and check constraint (from newer migrations),
-- uncomment the lines below to update it as well:
-- ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
-- ALTER TABLE employees ADD CONSTRAINT employees_role_check CHECK (role IN ('teacher', 'admin', 'office'));
