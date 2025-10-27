-- ============================================================================
-- migration: fix user profile creation
-- description: makes fire_department_id nullable and updates trigger to handle
--              cases where user is created without metadata
-- author: database migration system
-- date: 2025-10-23
-- ============================================================================
--
-- this migration fixes the issue where user creation fails if fire_department_id
-- is not provided in registration metadata. this is common when creating users
-- through supabase studio or admin apis.
--
-- changes:
-- 1. make fire_department_id nullable in profiles table
-- 2. update handle_new_user trigger to handle missing metadata gracefully
-- 3. users can update their fire_department_id later
--
-- ============================================================================

-- ============================================================================
-- section 1: modify profiles table
-- ============================================================================

-- make fire_department_id nullable to allow user creation without department
-- users can be assigned to a department later by an admin
alter table public.profiles 
  alter column fire_department_id drop not null;

comment on column public.profiles.fire_department_id is 'fire department the user belongs to (can be set after registration)';

-- ============================================================================
-- section 2: update trigger function
-- ============================================================================

-- drop the existing trigger first (we'll recreate it after updating the function)
drop trigger if exists on_auth_user_created on auth.users;

-- update the function to handle missing fire_department_id gracefully
-- if fire_department_id is not in metadata, it will be null
-- the profile will still be created, allowing the user to log in
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    fire_department_id, 
    first_name,
    last_name,
    role, 
    created_at, 
    updated_at
  )
  values (
    new.id,
    -- safely extract fire_department_id from metadata, null if not present
    (new.raw_user_meta_data->>'fire_department_id')::uuid,
    -- extract first_name from metadata if present
    new.raw_user_meta_data->>'first_name',
    -- extract last_name from metadata if present
    new.raw_user_meta_data->>'last_name',
    -- extract role from metadata, default to 'member'
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    now(),
    now()
  );
  return new;
exception
  when others then
    -- log the error but don't prevent user creation
    raise warning 'failed to create profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_new_user is 'trigger function to create profile after user registration (handles missing metadata gracefully)';

-- recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- section 3: update rls policies for department-less users
-- ============================================================================

-- update the policy for viewing department incidents to handle null fire_department_id
-- users without a department cannot see any incidents
drop policy if exists "authenticated_users_select_department_incidents" on public.incidents;

create policy "authenticated_users_select_department_incidents"
  on public.incidents
  for select
  to authenticated
  using (
    -- allow if user has a department and it matches the incident's department
    exists (
      select 1 
      from public.profiles 
      where id = auth.uid() 
      and fire_department_id is not null
      and fire_department_id = incidents.fire_department_id
    )
  );

-- update the policy for creating incidents to handle null fire_department_id
-- users without a department cannot create incidents
drop policy if exists "authenticated_users_insert_department_incidents" on public.incidents;

create policy "authenticated_users_insert_department_incidents"
  on public.incidents
  for insert
  to authenticated
  with check (
    user_id = auth.uid() 
    and exists (
      select 1
      from public.profiles 
      where id = auth.uid() 
      and fire_department_id is not null
      and fire_department_id = incidents.fire_department_id
    )
  );

-- update the policy for viewing department profiles
-- users without a department can only see their own profile
drop policy if exists "authenticated_users_select_department_profiles" on public.profiles;

create policy "authenticated_users_select_department_profiles"
  on public.profiles
  for select
  to authenticated
  using (
    -- allow if user has a department and viewing profiles from same department
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() 
      and p.fire_department_id is not null
      and p.fire_department_id = profiles.fire_department_id
    )
  );

-- ============================================================================
-- migration complete
-- ============================================================================

