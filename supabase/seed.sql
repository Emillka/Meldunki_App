-- ============================================================================
-- seed data for local development and testing
-- ============================================================================

-- insert sample county for mazowieckie province
insert into public.counties (province_id, name)
select id, 'warszawski zachodni'
from public.provinces
where name = 'mazowieckie'
on conflict do nothing;

-- insert sample fire departments
insert into public.fire_departments (county_id, name)
select c.id, 'OSP Ożarów Mazowiecki'
from public.counties c
join public.provinces p on c.province_id = p.id
where p.name = 'mazowieckie' and c.name = 'warszawski zachodni'
on conflict do nothing;

insert into public.fire_departments (county_id, name)
select c.id, 'OSP Błonie'
from public.counties c
join public.provinces p on c.province_id = p.id
where p.name = 'mazowieckie' and c.name = 'warszawski zachodni'
on conflict do nothing;

-- insert sample county for małopolskie province
insert into public.counties (province_id, name)
select id, 'krakowski'
from public.provinces
where name = 'małopolskie'
on conflict do nothing;

-- insert sample fire departments in małopolskie
insert into public.fire_departments (county_id, name)
select c.id, 'OSP Wieliczka'
from public.counties c
join public.provinces p on c.province_id = p.id
where p.name = 'małopolskie' and c.name = 'krakowski'
on conflict do nothing;

insert into public.fire_departments (county_id, name)
select c.id, 'OSP Niepołomice'
from public.counties c
join public.provinces p on c.province_id = p.id
where p.name = 'małopolskie' and c.name = 'krakowski'
on conflict do nothing;

-- display created fire departments
select 
  fd.id,
  fd.name as fire_department,
  c.name as county,
  p.name as province
from public.fire_departments fd
join public.counties c on fd.county_id = c.id
join public.provinces p on c.province_id = p.id
order by p.name, c.name, fd.name;

