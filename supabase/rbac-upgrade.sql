-- TeachTrack RBAC upgrade for an EXISTING database.
-- Run this in Supabase SQL Editor after backing up your project.
-- PostgreSQL enum values are additive.
alter type public.app_role add value if not exists 'principal';
alter type public.app_role add value if not exists 'vice_principal';
alter type public.app_role add value if not exists 'section_head';
alter type public.app_role add value if not exists 'reviewer';

create or replace function public.current_role() returns public.app_role
language sql stable security definer set search_path=public as $$
  select role from public.profiles where id=auth.uid();
$$;

-- Compare roles as text in this upgrade. PostgreSQL does not allow newly-added enum
-- labels to be used as enum values until the ALTER TYPE transaction commits.
create or replace function public.has_role(allowed text[]) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role::text = any(allowed));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select public.has_role(array['principal']);
$$;

create or replace function public.is_manager() returns boolean
language sql stable security definer set search_path=public as $$
  select public.has_role(array['principal','vice_principal']);
$$;

create or replace function public.can_review() returns boolean
language sql stable security definer set search_path=public as $$
  select public.has_role(array['principal','vice_principal','section_head','reviewer']);
$$;

-- Profiles
drop policy if exists "profile self or admin read" on public.profiles;
drop policy if exists "profile self or manager read" on public.profiles;
create policy "profile self or manager read" on public.profiles for select to authenticated
using (id=auth.uid() or public.is_manager());

-- Teachers
drop policy if exists "teachers admin or self read" on public.teachers;
drop policy if exists "teachers admin insert" on public.teachers;
drop policy if exists "teachers admin update" on public.teachers;
drop policy if exists "teachers admin delete" on public.teachers;
drop policy if exists "teachers manager or self read" on public.teachers;
create policy "teachers manager or self read" on public.teachers for select to authenticated using (public.is_manager() or id=public.my_teacher_id());
drop policy if exists "teachers manager insert" on public.teachers;
create policy "teachers manager insert" on public.teachers for insert to authenticated with check (public.is_manager());
drop policy if exists "teachers manager update" on public.teachers;
create policy "teachers manager update" on public.teachers for update to authenticated using (public.is_manager()) with check (public.is_manager());
drop policy if exists "teachers manager delete" on public.teachers;
create policy "teachers manager delete" on public.teachers for delete to authenticated using (public.is_manager());

-- Attendance / training
drop policy if exists "attendance admin or self read" on public.attendance;
drop policy if exists "attendance admin write" on public.attendance;
drop policy if exists "attendance manager or self read" on public.attendance;
create policy "attendance manager or self read" on public.attendance for select to authenticated using (public.is_manager() or teacher_id=public.my_teacher_id());
drop policy if exists "attendance manager write" on public.attendance;
create policy "attendance manager write" on public.attendance for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "training admin or self read" on public.training;
drop policy if exists "training admin write" on public.training;
drop policy if exists "training manager or self read" on public.training;
create policy "training manager or self read" on public.training for select to authenticated using (public.is_manager() or teacher_id=public.my_teacher_id());
drop policy if exists "training manager write" on public.training;
create policy "training manager write" on public.training for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- Lessons: reviewers may read/review; teachers can work on their own drafts.
drop policy if exists "lessons admin or self read" on public.lessons;
drop policy if exists "lessons reviewer or self read" on public.lessons;
drop policy if exists "lessons self draft update" on public.lessons;
drop policy if exists "lessons review or self draft update" on public.lessons;
create policy "lessons reviewer or self read" on public.lessons for select to authenticated using (public.can_review() or teacher_id=public.my_teacher_id());
create policy "lessons review or self draft update" on public.lessons for update to authenticated
using (public.can_review() or teacher_id=public.my_teacher_id())
with check (public.can_review() or (teacher_id=public.my_teacher_id() and status in ('Draft','Pending')));

-- Remaining management-owned records
drop policy if exists "achievements admin or self read" on public.achievements;
drop policy if exists "achievements admin write" on public.achievements;
drop policy if exists "achievements manager or self read" on public.achievements;
create policy "achievements manager or self read" on public.achievements for select to authenticated using (public.is_manager() or teacher_id=public.my_teacher_id());
drop policy if exists "achievements manager write" on public.achievements;
create policy "achievements manager write" on public.achievements for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "observations admin or self read" on public.observations;
drop policy if exists "observations admin write" on public.observations;
drop policy if exists "observations manager or self read" on public.observations;
create policy "observations manager or self read" on public.observations for select to authenticated using (public.is_manager() or teacher_id=public.my_teacher_id());
drop policy if exists "observations manager write" on public.observations;
create policy "observations manager write" on public.observations for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "development admin or self read" on public.development_recommendations;
drop policy if exists "development admin write" on public.development_recommendations;
drop policy if exists "development manager or self read" on public.development_recommendations;
create policy "development manager or self read" on public.development_recommendations for select to authenticated using (public.is_manager() or teacher_id=public.my_teacher_id());
drop policy if exists "development manager write" on public.development_recommendations;
create policy "development manager write" on public.development_recommendations for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "activity admin read" on public.activity_logs;
drop policy if exists "activity manager read" on public.activity_logs;
create policy "activity manager read" on public.activity_logs for select to authenticated using (public.is_manager());

-- Assign roles with SQL, for example:
-- update public.profiles set role='vice_principal' where id=(select id from auth.users where email='viceprincipal@school.edu');
-- update public.profiles set role='reviewer' where id=(select id from auth.users where email='reviewer@school.edu');

-- School leadership role examples:
-- update public.profiles set role='principal' where id=(select id from auth.users where email='principal@school.edu');
-- update public.profiles set role='vice_principal' where id=(select id from auth.users where email='viceprincipal@school.edu');
-- update public.profiles set role='section_head' where id=(select id from auth.users where email='sectionhead@school.edu');

-- Legacy cleanup for projects that previously used admin/manager:
-- Run BEFORE switching application code if those roles exist:
-- update public.profiles set role='principal' where role::text='admin';
-- update public.profiles set role='vice_principal' where role::text='manager';
-- Note: PostgreSQL enum labels remain in an existing DB unless the enum type is rebuilt,
-- but the application no longer grants or displays those legacy roles.
