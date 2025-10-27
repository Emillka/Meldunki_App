-- ============================================================================
-- SPRAWDZENIE UŻYTKOWNIKÓW W BAZIE
-- ============================================================================

-- 1. Użytkownicy w Supabase Auth (auth.users)
SELECT 
  '🔐 SUPABASE AUTH USERS' as info;

SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Profile użytkowników (public.profiles)
SELECT 
  '👤 USER PROFILES' as info;

SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  p.fire_department_id,
  fd.name as fire_department_name,
  p.created_at
FROM profiles p
LEFT JOIN fire_departments fd ON p.fire_department_id = fd.id
ORDER BY p.created_at DESC;

-- 3. Pełne informacje (JOIN auth.users + profiles)
SELECT 
  '🔗 FULL USER INFO (Auth + Profile)' as info;

SELECT 
  u.id as user_id,
  u.email,
  p.first_name,
  p.last_name,
  p.role,
  fd.name as fire_department,
  u.created_at as registered_at,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN fire_departments fd ON p.fire_department_id = fd.id
ORDER BY u.created_at DESC;

