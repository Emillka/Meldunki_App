-- Skrypt do tworzenia konta administratora w bazie danych
-- Uruchom w Supabase SQL Editor

-- 1. Sprawdź czy istnieją jednostki OSP
SELECT 'Sprawdzanie jednostek OSP...' as status;
SELECT id, name FROM fire_departments LIMIT 5;

-- 2. Jeśli nie ma jednostek OSP, utwórz przykładową
INSERT INTO fire_departments (id, county_id, name, city)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM counties LIMIT 1),
  'OSP Przykładowa',
  'Przykładowe Miasto'
WHERE NOT EXISTS (SELECT 1 FROM fire_departments LIMIT 1);

-- 3. Utwórz użytkownika w auth.users (jeśli nie istnieje)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at,
  app_metadata,
  user_metadata,
  identities,
  factors,
  email_change,
  email_change_token_new,
  recovery_sent_at,
  new_email,
  invited_at,
  action_link,
  email_change_sent_at,
  recovery_token,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'admin@firelog.pl',
  crypt('Admin123!@#', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"fire_department_id": "00000000-0000-0000-0000-000000000001", "first_name": "System", "last_name": "Administrator", "role": "admin"}',
  false,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"fire_department_id": "00000000-0000-0000-0000-000000000001", "first_name": "System", "last_name": "Administrator", "role": "admin"}',
  '[]',
  '[]',
  '',
  '',
  null,
  '',
  null,
  '',
  '',
  0,
  null,
  '',
  null,
  false,
  null
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@firelog.pl');

-- 4. Utwórz profil administratora
INSERT INTO profiles (
  id,
  fire_department_id,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'System',
  'Administrator',
  'admin',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid);

-- 5. Sprawdź utworzone konto
SELECT 'Konto administratora utworzone:' as status;
SELECT 
  u.email,
  p.first_name,
  p.last_name,
  p.role,
  fd.name as fire_department
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN fire_departments fd ON p.fire_department_id = fd.id
WHERE u.email = 'admin@firelog.pl';

-- 6. Wyświetl dane logowania
SELECT 
  'DANE LOGOWANIA:' as info,
  'Email: admin@firelog.pl' as email,
  'Hasło: Admin123!@#' as password,
  'Rola: Administrator' as role,
  'WAŻNE: Zmień hasło po pierwszym logowaniu!' as warning;
