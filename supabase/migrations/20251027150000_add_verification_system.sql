-- ============================================================================
-- migration: add verification system for fire departments
-- description: adds verification_code to fire_departments and is_verified to profiles
--              to prevent unauthorized users from joining fire departments
-- author: database migration system
-- date: 2025-10-27
-- ============================================================================
--
-- this migration adds a verification system:
-- 1. fire_departments get a unique verification_code
-- 2. profiles get an is_verified flag (default false)
-- 3. users must provide correct verification_code during registration
-- 4. only verified users can see all department meldunki
--
-- ============================================================================

-- ============================================================================
-- section 1: add verification_code to fire_departments
-- ============================================================================

-- add verification_code column (unique, not null after generation)
alter table public.fire_departments 
  add column verification_code varchar(20) unique;

comment on column public.fire_departments.verification_code is 'unique verification code required to join this fire department';

-- ============================================================================
-- section 2: add is_verified to profiles
-- ============================================================================

-- add is_verified column (default false)
alter table public.profiles 
  add column is_verified boolean not null default false;

comment on column public.profiles.is_verified is 'whether user has been verified as a member of their fire department';

-- ============================================================================
-- section 3: function to generate verification code
-- ============================================================================

-- function to generate a random verification code (8 characters, alphanumeric)
create or replace function public.generate_verification_code()
returns varchar(20) as $$
declare
  chars varchar(62) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code varchar(20) := '';
  i integer;
begin
  -- generate 8 character code
  for i in 1..8 loop
    code := code || substr(chars, floor(random() * 62 + 1)::integer, 1);
  end loop;
  
  return code;
end;
$$ language plpgsql;

comment on function public.generate_verification_code is 'generates a random 8-character alphanumeric verification code';

-- ============================================================================
-- section 4: generate verification codes for existing fire departments
-- ============================================================================

-- update all existing fire departments with verification codes
-- codes are generated randomly and are unique
do $$
declare
  dept record;
  new_code varchar(20);
  code_exists boolean;
begin
  for dept in select id from public.fire_departments where verification_code is null loop
    -- generate unique code
    loop
      new_code := public.generate_verification_code();
      select exists(select 1 from public.fire_departments where verification_code = new_code) into code_exists;
      exit when not code_exists;
    end loop;
    
    -- update department with generated code
    update public.fire_departments 
    set verification_code = new_code 
    where id = dept.id;
  end loop;
end $$;

-- ============================================================================
-- section 5: make verification_code not null after generation
-- ============================================================================

-- now that all existing departments have codes, make it required
alter table public.fire_departments 
  alter column verification_code set not null;

-- ============================================================================
-- section 6: add index for faster verification lookups
-- ============================================================================

-- index for verification_code lookups during registration
create index idx_fire_departments_verification_code on public.fire_departments(verification_code);

-- index for is_verified checks
create index idx_profiles_is_verified on public.profiles(is_verified);

-- ============================================================================
-- migration complete
-- ============================================================================

