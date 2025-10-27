-- ============================================================================
-- Seed data dla testowania endpointa /api/auth/register
-- ============================================================================
-- UWAGA: Województwa (provinces) są już w bazie z migracji!
-- Ten skrypt dodaje tylko powiat i jednostkę OSP.
-- ============================================================================

-- Krok 1: Dodaj powiat "warszawski" w województwie mazowieckim
-- Używamy subquery aby pobrać ID województwa z bazy
INSERT INTO counties (id, province_id, name) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  p.id,
  'warszawski'
FROM provinces p
WHERE p.name = 'mazowieckie'
ON CONFLICT (province_id, name) DO NOTHING;

-- Krok 2: Dodaj jednostkę OSP w powiecie warszawskim
-- To jest UUID który będziesz używać w formularzu rejestracji!
INSERT INTO fire_departments (id, county_id, name) 
SELECT
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  c.id,
  'OSP Warszawa Mokotów'
FROM counties c
JOIN provinces p ON c.province_id = p.id
WHERE p.name = 'mazowieckie' 
  AND c.name = 'warszawski'
ON CONFLICT (county_id, name) DO NOTHING;

-- ============================================================================
-- Sprawdzenie - Zobacz co zostało dodane
-- ============================================================================
SELECT 
  fd.id as fire_department_id,
  fd.name as fire_department,
  c.name as county,
  p.name as province
FROM fire_departments fd
JOIN counties c ON fd.county_id = c.id
JOIN provinces p ON c.province_id = p.id
WHERE fd.name = 'OSP Warszawa Mokotów';

-- ============================================================================
-- ✅ UŻYJ TEGO UUID W FORMULARZU:
-- fire_department_id = 550e8400-e29b-41d4-a716-446655440000
-- ============================================================================

