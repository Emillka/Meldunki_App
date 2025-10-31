-- Skrypt do tworzenia konta administratora w bazie danych
-- Uruchom w Supabase SQL Editor

-- 1. Sprawdź czy istnieją jednostki OSP
SELECT 'Sprawdzanie jednostek OSP...' as status;
SELECT id, name FROM fire_departments LIMIT 5;

-- 2. Jeśli nie ma województw i powiatów, utwórz przykładowe
INSERT INTO provinces (name)
SELECT 'mazowieckie'
WHERE NOT EXISTS (SELECT 1 FROM provinces LIMIT 1);

INSERT INTO counties (province_id, name)
SELECT (SELECT id FROM provinces LIMIT 1), 'warszawski'
WHERE NOT EXISTS (SELECT 1 FROM counties LIMIT 1);

-- 3. Jeśli nie ma jednostek OSP, utwórz przykładową (bez kolumny city - zgodnie ze schematem)
INSERT INTO fire_departments (id, county_id, name)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM counties LIMIT 1),
  'OSP Przykładowa'
WHERE NOT EXISTS (SELECT 1 FROM fire_departments LIMIT 1);

-- 4. Utwórz użytkownika w auth.users
-- UWAGA: Jeśli ten INSERT nie działa, użyj metody alternatywnej przez Supabase Dashboard
-- Authentication > Users > Add User (lub użyj skryptu Node.js)
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
  raw_user_meta_data
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
  '{"fire_department_id": "00000000-0000-0000-0000-000000000001", "first_name": "System", "last_name": "Administrator", "role": "admin"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@firelog.pl');

-- 5. Utwórz profil administratora
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

-- 6. Sprawdź utworzone konto
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

-- 7. Wyświetl dane logowania
SELECT 
  'DANE LOGOWANIA:' as info,
  'Email: admin@firelog.pl' as email,
  'Hasło: Admin123!@#' as password,
  'Rola: Administrator' as role,
  'WAŻNE: Zmień hasło po pierwszym logowaniu!' as warning;
