-- TeachTrack: FIXED User Control upgrade
-- Run this in Supabase SQL Editor.
-- This file is self-contained for the Principal / Vice Principal user-control feature.

-- 1) Core RBAC helpers
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path=public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.has_role(allowed text[])
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text = any(allowed)
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.has_role(array['principal','vice_principal']);
$$;

create or replace function public.can_review()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.has_role(array['principal','vice_principal','section_head','reviewer']);
$$;

-- 2) Principal / VP can read profiles for account management
drop policy if exists "profile self or leadership read" on public.profiles;
drop policy if exists "profile self or manager read" on public.profiles;
drop policy if exists "profile self or admin read" on public.profiles;

create policy "profile self or leadership read"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_manager()
);

-- 3) Secure role-changing function
create or replace function public.set_user_role(
  target_user uuid,
  new_role public.app_role
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  caller_role text;
  target_role text;
begin
  select role::text
  into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role is null then
    raise exception 'No profile found for current user';
  end if;

  if target_user = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;

  select role::text
  into target_role
  from public.profiles
  where id = target_user;

  if target_role is null then
    raise exception 'Target user profile not found';
  end if;

  if caller_role = 'principal' then
    if new_role::text not in (
      'principal',
      'vice_principal',
      'section_head',
      'reviewer',
      'teacher'
    ) then
      raise exception 'Role not allowed';
    end if;

  elsif caller_role = 'vice_principal' then
    if target_role in ('principal','vice_principal') then
      raise exception 'Vice Principal cannot modify Principal or Vice Principal accounts';
    end if;

    if new_role::text not in (
      'section_head',
      'reviewer',
      'teacher'
    ) then
      raise exception 'Vice Principal cannot assign this role';
    end if;

  else
    raise exception 'Not authorized';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user;

  insert into public.activity_logs(
    actor_id,
    actor_name,
    action,
    entity_type,
    metadata
  )
  select
    auth.uid(),
    coalesce(p.full_name, 'Leadership user'),
    'Changed user role',
    'profile',
    jsonb_build_object(
      'target_user', target_user,
      'previous_role', target_role,
      'new_role', new_role::text
    )
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

grant execute on function public.set_user_role(uuid, public.app_role)
to authenticated;
