-- ============================================================================
-- migration: initial schema for firelog application
-- description: creates core database structure for fire department incident reporting
-- author: database migration system
-- date: 2025-10-23
-- ============================================================================
--
-- this migration creates the complete initial schema including:
-- - administrative hierarchy tables (provinces, counties, fire_departments)
-- - user profile management (profiles)
-- - incident reporting (incidents)
-- - row level security policies
-- - triggers for automatic timestamp updates
-- - indexes for query optimization
-- - initial data for polish provinces
--
-- ============================================================================

-- ============================================================================
-- section 1: extensions
-- ============================================================================

-- enable uuid generation for primary keys
-- use gen_random_uuid() which is available by default in PostgreSQL 13+
-- no need to create uuid-ossp extension

-- ============================================================================
-- section 2: core tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- table: provinces (województwa)
-- purpose: stores list of polish provinces (voivodeships)
-- notes: this is a reference table that should be pre-populated with all 16 
--        polish provinces. it forms the top of the administrative hierarchy.
-- ----------------------------------------------------------------------------
create table public.provinces (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  created_at timestamptz not null default now()
);

comment on table public.provinces is 'list of polish provinces (województwa)';
comment on column public.provinces.id is 'unique identifier for the province';
comment on column public.provinces.name is 'official name of the province';
comment on column public.provinces.created_at is 'timestamp when the record was created';

-- ----------------------------------------------------------------------------
-- table: counties (powiaty)
-- purpose: stores list of counties within provinces
-- notes: each county belongs to exactly one province. the combination of 
--        province_id and name must be unique to prevent duplicate county 
--        names within the same province.
-- ----------------------------------------------------------------------------
create table public.counties (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.provinces(id) on delete cascade,
  name varchar(100) not null,
  created_at timestamptz not null default now(),
  
  -- ensure unique county names within each province
  unique(province_id, name)
);

comment on table public.counties is 'list of counties (powiaty) assigned to provinces';
comment on column public.counties.id is 'unique identifier for the county';
comment on column public.counties.province_id is 'reference to parent province';
comment on column public.counties.name is 'name of the county';
comment on column public.counties.created_at is 'timestamp when the record was created';

-- ----------------------------------------------------------------------------
-- table: fire_departments (jednostki osp)
-- purpose: stores volunteer fire department units
-- notes: each fire department belongs to exactly one county. on delete restrict
--        is used for profile references to prevent accidental deletion of 
--        departments that have associated users.
-- ----------------------------------------------------------------------------
create table public.fire_departments (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references public.counties(id) on delete cascade,
  name varchar(255) not null,
  created_at timestamptz not null default now(),
  
  -- ensure unique fire department names within each county
  unique(county_id, name)
);

comment on table public.fire_departments is 'list of volunteer fire departments (osp)';
comment on column public.fire_departments.id is 'unique identifier for the fire department';
comment on column public.fire_departments.county_id is 'reference to parent county';
comment on column public.fire_departments.name is 'name of the fire department unit';
comment on column public.fire_departments.created_at is 'timestamp when the record was created';

-- ----------------------------------------------------------------------------
-- table: profiles (profile użytkowników)
-- purpose: extends supabase auth.users with application-specific user data
-- notes: this table has a 1:1 relationship with auth.users. the id must match
--        the id from auth.users. fire_department_id uses on delete restrict to
--        prevent deletion of departments with active users. role defaults to
--        'member' and is constrained to only allow 'member' or 'admin' values.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  fire_department_id uuid not null references public.fire_departments(id) on delete restrict,
  first_name varchar(100),
  last_name varchar(100),
  role varchar(50) not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- ensure role is either 'member' or 'admin'
  check(role in ('member', 'admin'))
);

comment on table public.profiles is 'user profiles extending auth.users with application data';
comment on column public.profiles.id is 'user id (matches auth.users.id)';
comment on column public.profiles.fire_department_id is 'fire department the user belongs to';
comment on column public.profiles.first_name is 'user first name';
comment on column public.profiles.last_name is 'user last name';
comment on column public.profiles.role is 'user role: member or admin';
comment on column public.profiles.created_at is 'timestamp when profile was created';
comment on column public.profiles.updated_at is 'timestamp of last profile update';

-- ----------------------------------------------------------------------------
-- table: incidents (meldunki z akcji)
-- purpose: stores fire department incident reports
-- notes: this is the main transactional table. each incident belongs to one
--        user and one fire department. various check constraints ensure data
--        validity (time logic, coordinate ranges). ai-generated fields
--        (category, summary) are nullable and populated asynchronously.
-- ----------------------------------------------------------------------------
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  fire_department_id uuid not null references public.fire_departments(id) on delete restrict,
  incident_date date not null,
  incident_name varchar(255) not null,
  location_address text,
  location_latitude decimal(10, 8),
  location_longitude decimal(11, 8),
  description text not null,
  forces_and_resources text,
  commander varchar(255),
  driver varchar(255),
  start_time timestamptz not null,
  end_time timestamptz,
  category varchar(100),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- ensure end time is after or equal to start time
  check(end_time is null or end_time >= start_time),
  
  -- validate latitude is within valid range (-90 to 90 degrees)
  check(location_latitude is null or (location_latitude >= -90 and location_latitude <= 90)),
  
  -- validate longitude is within valid range (-180 to 180 degrees)
  check(location_longitude is null or (location_longitude >= -180 and location_longitude <= 180))
);

comment on table public.incidents is 'fire department incident reports (meldunki)';
comment on column public.incidents.id is 'unique identifier for the incident';
comment on column public.incidents.user_id is 'user who created the incident report';
comment on column public.incidents.fire_department_id is 'fire department that handled the incident';
comment on column public.incidents.incident_date is 'date when the incident occurred';
comment on column public.incidents.incident_name is 'name/title of the incident';
comment on column public.incidents.location_address is 'text address of the incident location';
comment on column public.incidents.location_latitude is 'latitude coordinate of incident location';
comment on column public.incidents.location_longitude is 'longitude coordinate of incident location';
comment on column public.incidents.description is 'detailed description of the incident and response';
comment on column public.incidents.forces_and_resources is 'description of forces and resources deployed';
comment on column public.incidents.commander is 'name of the incident commander';
comment on column public.incidents.driver is 'name of the vehicle driver';
comment on column public.incidents.start_time is 'timestamp when the incident response started';
comment on column public.incidents.end_time is 'timestamp when the incident response ended';
comment on column public.incidents.category is 'ai-generated incident category';
comment on column public.incidents.summary is 'ai-generated incident summary';
comment on column public.incidents.created_at is 'timestamp when the report was created';
comment on column public.incidents.updated_at is 'timestamp of last report update';

-- ============================================================================
-- section 3: indexes for query optimization
-- ============================================================================

-- indexes for counties table
-- this index speeds up queries that filter or join on province_id
create index idx_counties_province_id on public.counties(province_id);

-- indexes for fire_departments table
-- this index speeds up queries that filter or join on county_id
create index idx_fire_departments_county_id on public.fire_departments(county_id);

-- indexes for profiles table
-- index on fire_department_id for filtering users by department
create index idx_profiles_fire_department_id on public.profiles(fire_department_id);

-- index on role for filtering by user role (e.g., finding all admins)
create index idx_profiles_role on public.profiles(role);

-- indexes for incidents table
-- index on user_id for finding all incidents created by a specific user
create index idx_incidents_user_id on public.incidents(user_id);

-- index on fire_department_id for finding all incidents for a department
create index idx_incidents_fire_department_id on public.incidents(fire_department_id);

-- descending index on incident_date for sorting incidents chronologically
-- desc ordering optimizes queries that show newest incidents first
create index idx_incidents_incident_date on public.incidents(incident_date desc);

-- descending index on created_at for sorting by creation time
create index idx_incidents_created_at on public.incidents(created_at desc);

-- index on category for filtering incidents by ai-generated category
create index idx_incidents_category on public.incidents(category);

-- full-text search indexes using gin (generalized inverted index)
-- note: using 'simple' configuration for universal compatibility
-- for production with polish language support, replace 'simple' with 'polish'
-- after installing the polish dictionary: CREATE TEXT SEARCH CONFIGURATION polish ...
create index idx_incidents_description_fts on public.incidents 
  using gin(to_tsvector('simple', description));

create index idx_incidents_incident_name_fts on public.incidents 
  using gin(to_tsvector('simple', incident_name));

-- ============================================================================
-- section 4: helper functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- function: update_updated_at_column
-- purpose: automatically updates the updated_at timestamp on row updates
-- usage: attached to tables via triggers
-- notes: this ensures updated_at is always current without manual intervention
-- ----------------------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function public.update_updated_at_column is 'trigger function to automatically update updated_at timestamp';

-- ----------------------------------------------------------------------------
-- function: handle_new_user
-- purpose: automatically creates a profile when a new user registers
-- usage: triggered after insert on auth.users
-- notes: extracts fire_department_id and role from user metadata.
--        security definer allows the function to insert into profiles table
--        even though the trigger runs in auth schema context.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, fire_department_id, role, created_at, updated_at)
  values (
    new.id,
    (new.raw_user_meta_data->>'fire_department_id')::uuid,
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_new_user is 'trigger function to create profile after user registration';

-- ============================================================================
-- section 5: triggers
-- ============================================================================

-- trigger to update updated_at on profiles table
-- fires before each update to ensure timestamp is current
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

-- trigger to update updated_at on incidents table
-- fires before each update to ensure timestamp is current
create trigger update_incidents_updated_at
  before update on public.incidents
  for each row
  execute function public.update_updated_at_column();

-- trigger to create profile after user registration
-- fires after new user is inserted into auth.users
-- automatically populates profiles table with data from registration metadata
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- section 6: row level security (rls)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- enable rls on all tables
-- note: reference tables (provinces, counties, fire_departments) also have
--       rls enabled for consistency, even though they will have permissive
--       policies allowing public read access
-- ----------------------------------------------------------------------------

-- enable rls on reference tables
alter table public.provinces enable row level security;
alter table public.counties enable row level security;
alter table public.fire_departments enable row level security;

-- enable rls on user and transactional tables
alter table public.profiles enable row level security;
alter table public.incidents enable row level security;

-- ----------------------------------------------------------------------------
-- rls policies for provinces table
-- purpose: allow all authenticated and anonymous users to read provinces
-- rationale: provinces are reference data needed for registration and filtering
-- ----------------------------------------------------------------------------

-- policy: anonymous users can view all provinces
-- allows unauthenticated users to read province list (needed for registration)
create policy "anonymous_users_select_provinces"
  on public.provinces
  for select
  to anon
  using (true);

-- policy: authenticated users can view all provinces
-- allows authenticated users to read province list
create policy "authenticated_users_select_provinces"
  on public.provinces
  for select
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- rls policies for counties table
-- purpose: allow all authenticated and anonymous users to read counties
-- rationale: counties are reference data needed for registration and filtering
-- ----------------------------------------------------------------------------

-- policy: anonymous users can view all counties
-- allows unauthenticated users to read county list (needed for registration)
create policy "anonymous_users_select_counties"
  on public.counties
  for select
  to anon
  using (true);

-- policy: authenticated users can view all counties
-- allows authenticated users to read county list
create policy "authenticated_users_select_counties"
  on public.counties
  for select
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- rls policies for fire_departments table
-- purpose: allow all authenticated and anonymous users to read fire departments
-- rationale: fire departments are reference data needed for registration
-- ----------------------------------------------------------------------------

-- policy: anonymous users can view all fire departments
-- allows unauthenticated users to read fire department list (needed for registration)
create policy "anonymous_users_select_fire_departments"
  on public.fire_departments
  for select
  to anon
  using (true);

-- policy: authenticated users can view all fire departments
-- allows authenticated users to read fire department list
create policy "authenticated_users_select_fire_departments"
  on public.fire_departments
  for select
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- rls policies for profiles table
-- purpose: control access to user profile data
-- notes: policies are granular - separate for select, insert, update
--        users can view their own profile and profiles from their department
-- ----------------------------------------------------------------------------

-- policy: authenticated users can view their own profile
-- rationale: users need to read their own profile data
create policy "authenticated_users_select_own_profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- policy: authenticated users can view profiles from their fire department
-- rationale: users should see who else is in their fire department
-- note: this allows seeing all profiles within the same department
create policy "authenticated_users_select_department_profiles"
  on public.profiles
  for select
  to authenticated
  using (
    fire_department_id in (
      select fire_department_id 
      from public.profiles 
      where id = auth.uid()
    )
  );

-- policy: authenticated users can insert their own profile
-- rationale: allows profile creation during registration
-- note: the user_id must match the authenticated user's id
create policy "authenticated_users_insert_own_profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- policy: authenticated users can update their own profile
-- rationale: users should be able to edit their own profile information
-- note: using and with check both verify ownership
create policy "authenticated_users_update_own_profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- rls policies for incidents table
-- purpose: control access to incident reports
-- notes: users can only see incidents from their fire department
--        users can only create incidents for their department
--        users can edit/delete their own incidents
--        admins have additional permissions for department-wide management
-- ----------------------------------------------------------------------------

-- policy: authenticated users can view incidents from their fire department
-- rationale: users should see all incidents from their department for collaboration
create policy "authenticated_users_select_department_incidents"
  on public.incidents
  for select
  to authenticated
  using (
    fire_department_id in (
      select fire_department_id 
      from public.profiles 
      where id = auth.uid()
    )
  );

-- policy: authenticated users can create incidents for their fire department
-- rationale: users should be able to report incidents
-- note: ensures user_id matches creator and department matches user's department
create policy "authenticated_users_insert_department_incidents"
  on public.incidents
  for insert
  to authenticated
  with check (
    user_id = auth.uid() 
    and fire_department_id in (
      select fire_department_id 
      from public.profiles 
      where id = auth.uid()
    )
  );

-- policy: authenticated users can update their own incidents
-- rationale: users should be able to edit their own incident reports
create policy "authenticated_users_update_own_incidents"
  on public.incidents
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: authenticated users can delete their own incidents
-- rationale: users should be able to remove their own incident reports
create policy "authenticated_users_delete_own_incidents"
  on public.incidents
  for delete
  to authenticated
  using (user_id = auth.uid());

-- policy: admin users can update all incidents in their department
-- rationale: admins need to manage and correct incident reports in their department
-- note: checks that user has admin role and incident is from their department
create policy "admin_users_update_department_incidents"
  on public.incidents
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'admin' 
      and fire_department_id = incidents.fire_department_id
    )
  );

-- policy: admin users can delete all incidents in their department
-- rationale: admins need to manage incident reports in their department
-- note: checks that user has admin role and incident is from their department
create policy "admin_users_delete_department_incidents"
  on public.incidents
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'admin' 
      and fire_department_id = incidents.fire_department_id
    )
  );

-- ============================================================================
-- section 7: initial data - polish provinces
-- ============================================================================

-- insert all 16 polish provinces
-- note: these are reference data that should not be modified by application users
insert into public.provinces (name) values
  ('mazowieckie'),
  ('małopolskie'),
  ('śląskie'),
  ('pomorskie'),
  ('dolnośląskie'),
  ('wielkopolskie'),
  ('zachodniopomorskie'),
  ('lubelskie'),
  ('łódzkie'),
  ('podkarpackie'),
  ('warmińsko-mazurskie'),
  ('kujawsko-pomorskie'),
  ('podlaskie'),
  ('świętokrzyskie'),
  ('lubuskie'),
  ('opolskie');

-- ============================================================================
-- migration complete
-- ============================================================================

