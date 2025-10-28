-- ============================================================================
-- migration: fix infinite recursion in profiles policy
-- description: fixes the infinite recursion issue in the profiles RLS policy
-- author: database migration system
-- date: 2025-10-27
-- ============================================================================

-- Drop the problematic policy that causes infinite recursion
drop policy if exists "authenticated_users_select_department_profiles" on public.profiles;

-- Create a simpler policy that doesn't cause recursion
-- Users can view profiles from their own fire department by directly checking their own profile
create policy "authenticated_users_select_department_profiles"
  on public.profiles
  for select
  to authenticated
  using (
    fire_department_id = (
      select fire_department_id 
      from public.profiles 
      where id = auth.uid()
    )
  );
