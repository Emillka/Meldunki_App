-- =========================================================================
-- migration: remove coordinates from incidents
-- description: drops location_latitude and location_longitude columns
-- author: automated
-- date: 2025-10-30
-- =========================================================================

begin;

-- Safely drop columns if they exist
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'incidents' and column_name = 'location_latitude'
  ) then
    execute 'alter table public.incidents drop column location_latitude';
  end if;
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'incidents' and column_name = 'location_longitude'
  ) then
    execute 'alter table public.incidents drop column location_longitude';
  end if;
end $$;

commit;


