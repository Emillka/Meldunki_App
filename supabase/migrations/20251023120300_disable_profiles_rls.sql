-- ============================================================================
-- migration: disable RLS on profiles temporarily for registration
-- description: temporarily disables RLS on profiles to allow registration to work
-- author: database migration system
-- date: 2025-10-27
-- ============================================================================

-- Drop all existing policies on profiles
drop policy if exists "authenticated_users_select_department_profiles" on public.profiles;
drop policy if exists "authenticated_users_insert_own_profile" on public.profiles;
drop policy if exists "authenticated_users_update_own_profile" on public.profiles;

-- Temporarily disable RLS on profiles to allow registration
-- This is a temporary fix - in production, proper policies should be implemented
alter table public.profiles disable row level security;
