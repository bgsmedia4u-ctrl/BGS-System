-- 1. Create a function to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, status, created_at, updated_at)
  values (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'teacher', -- Defaulting to teacher instead of admin
    'approved', -- Auto-approve registration so no admin approval is required
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the trigger on Supabase's auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Backfill any existing users that were already created but missing profiles
insert into public.profiles (id, name, email, role, status, created_at, updated_at)
select 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  email, 
  'teacher',
  'approved',
  now(), 
  now()
from auth.users
on conflict (id) do update set status = 'approved'; -- Auto-approve any existing stuck users!

