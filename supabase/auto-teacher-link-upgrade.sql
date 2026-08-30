-- TeachTrack automatic teacher code + Auth account linking upgrade
-- Run after the existing migrations.

-- 1) Human-friendly teacher code.
alter table public.teachers
  add column if not exists teacher_code text;

-- Populate existing teachers.
update public.teachers
set teacher_code = 'TCH-' || lpad(id::text, 4, '0')
where teacher_code is null or btrim(teacher_code) = '';

-- Keep teacher codes unique.
create unique index if not exists teachers_teacher_code_key
  on public.teachers(teacher_code);

-- 2) Generate a teacher code automatically for every newly inserted teacher.
create or replace function public.assign_teacher_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.teacher_code is null or btrim(new.teacher_code) = '' then
    -- id is generated before BEFORE INSERT triggers for identity columns.
    new.teacher_code := 'TCH-' || lpad(new.id::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_teacher_code on public.teachers;
create trigger trg_assign_teacher_code
before insert on public.teachers
for each row
execute function public.assign_teacher_code();

-- 3) Link existing Auth users to teacher records when emails match.
update public.profiles p
set
  teacher_id = t.id,
  full_name = case
    when coalesce(btrim(p.full_name), '') = '' then t.name
    else p.full_name
  end
from auth.users u
join public.teachers t
  on lower(t.email) = lower(u.email)
where p.id = u.id
  and p.teacher_id is null;

-- 4) Upgrade the Auth signup trigger:
--    - creates a profile
--    - automatically links teacher_id by matching email
--    - uses the teacher name when available
--    - keeps the safe default role "teacher"
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_teacher_id bigint;
  matched_teacher_name text;
begin
  select t.id, t.name
    into matched_teacher_id, matched_teacher_name
  from public.teachers t
  where new.email is not null
    and lower(t.email) = lower(new.email)
  limit 1;

  insert into public.profiles(id, full_name, role, teacher_id)
  values(
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      matched_teacher_name,
      ''
    ),
    'teacher'::public.app_role,
    matched_teacher_id
  )
  on conflict (id) do update
  set
    teacher_id = coalesce(public.profiles.teacher_id, excluded.teacher_id),
    full_name = case
      when coalesce(btrim(public.profiles.full_name), '') = ''
        then excluded.full_name
      else public.profiles.full_name
    end;

  -- Also record the Auth UUID on the teacher row when a match exists.
  if matched_teacher_id is not null then
    update public.teachers
    set user_id = new.id
    where id = matched_teacher_id
      and (user_id is null or user_id = new.id);
  end if;

  return new;
end;
$$;

-- Recreate trigger so the upgraded function is definitely used.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 5) Keep links synchronized when a teacher record is added AFTER the Auth account.
create or replace function public.link_teacher_to_existing_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_user_id uuid;
begin
  select u.id
    into matched_user_id
  from auth.users u
  where lower(u.email) = lower(new.email)
  limit 1;

  if matched_user_id is not null then
    new.user_id := coalesce(new.user_id, matched_user_id);

    update public.profiles
    set
      teacher_id = new.id,
      full_name = case
        when coalesce(btrim(full_name), '') = '' then new.name
        else full_name
      end
    where id = matched_user_id
      and teacher_id is null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_link_teacher_to_existing_auth on public.teachers;
create trigger trg_link_teacher_to_existing_auth
after insert or update of email on public.teachers
for each row
execute function public.link_teacher_to_existing_auth();

-- NOTE:
-- An AFTER trigger cannot modify NEW.user_id. The synchronization update above
-- links profiles.teacher_id. To synchronize teachers.user_id as well, use this
-- companion trigger.
create or replace function public.sync_teacher_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_user_id uuid;
begin
  select u.id into matched_user_id
  from auth.users u
  where lower(u.email) = lower(new.email)
  limit 1;

  if matched_user_id is not null and new.user_id is distinct from matched_user_id then
    update public.teachers
    set user_id = matched_user_id
    where id = new.id
      and (user_id is null or user_id = matched_user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_teacher_user_id on public.teachers;
create trigger trg_sync_teacher_user_id
after insert or update of email on public.teachers
for each row
execute function public.sync_teacher_user_id();

-- Verification
-- select id, teacher_code, name, email, user_id from public.teachers order by id;
-- select id, full_name, role, teacher_id from public.profiles order by created_at desc;
