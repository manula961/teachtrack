-- TeachTrack Departments diagnostic
-- Safe/read-only checks except for the final commented test insert.

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema='public'
  and table_name='departments'
order by ordinal_position;

select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname='public'
  and tablename='departments'
order by policyname;

-- Confirm the currently signed-in app role from the application session:
-- select public.current_role(), public.is_manager();

-- Optional SQL Editor smoke test (runs as database owner, not RLS-authenticated user):
-- insert into public.departments(name) values ('Temporary Test Department');
-- delete from public.departments where name='Temporary Test Department';
