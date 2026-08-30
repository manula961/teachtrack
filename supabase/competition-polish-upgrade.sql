-- TeachTrack competition polish upgrade
-- Run AFTER auto-teacher-link-upgrade.sql.
-- Adds promotion safeguards, approval-to-record integration, and scheduled exam duty fields.

-- -----------------------------------------------------------------------------
-- Promotion safety
-- -----------------------------------------------------------------------------
-- A source class may only be promoted once into the same target academic year.
-- This is the database-level second layer beneath the UI preflight checks.
create unique index if not exists school_year_promotions_source_year_key
  on public.school_year_promotions(from_year,to_year,source_class_id)
  where source_class_id is not null;

-- -----------------------------------------------------------------------------
-- Exam scheduling fields for conflict detection
-- -----------------------------------------------------------------------------
alter table public.exam_responsibilities add column if not exists duty_date date;
alter table public.exam_responsibilities add column if not exists start_time time;
alter table public.exam_responsibilities add column if not exists end_time time;
alter table public.exam_responsibilities add column if not exists location text not null default '';

-- -----------------------------------------------------------------------------
-- Training approval state
-- Existing records stay approved; new UI submissions are explicitly marked Pending.
-- -----------------------------------------------------------------------------
alter table public.training add column if not exists approval_status text not null default 'Approved';
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='training_approval_status_check'
      and conrelid='public.training'::regclass
  ) then
    alter table public.training
      add constraint training_approval_status_check
      check (approval_status in ('Pending','Approved','Rejected'));
  end if;
end $$;

-- Prevent multiple active workflow requests for the same underlying record.
create unique index if not exists approval_requests_one_pending_entity_key
  on public.approval_requests(entity_type,entity_id)
  where entity_id is not null and status='Pending';

-- Helper to create a workflow request without exposing workflow internals to pages.
create or replace function public.enqueue_default_approval(
  p_entity_type text,
  p_entity_id bigint,
  p_title text,
  p_description text default ''
) returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  wf_id bigint;
begin
  select id into wf_id
  from public.approval_workflows
  where entity_type=p_entity_type and active=true
  order by id
  limit 1;

  if wf_id is null then return; end if;

  insert into public.approval_requests(
    workflow_id,entity_type,entity_id,title,description,requested_by,current_step,status
  ) values (
    wf_id,p_entity_type,p_entity_id,p_title,coalesce(p_description,''),auth.uid(),0,'Pending'
  ) on conflict do nothing;
end;
$$;

-- New leave requests automatically enter the configured Leave Approval workflow.
create or replace function public.enqueue_leave_approval()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status='Pending' then
    perform public.enqueue_default_approval(
      'leave',new.id,
      'Leave request #'||new.id,
      new.leave_type||' leave: '||new.start_date||' to '||new.end_date
    );
  end if;
  return new;
end;
$$;
drop trigger if exists trg_enqueue_leave_approval on public.leave_requests;
create trigger trg_enqueue_leave_approval
after insert on public.leave_requests
for each row execute function public.enqueue_leave_approval();

-- Lesson plans enter workflow whenever they are submitted as Pending.
create or replace function public.enqueue_lesson_approval()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status='Pending' and (tg_op='INSERT' or old.status is distinct from 'Pending') then
    perform public.enqueue_default_approval(
      'lesson_plan',new.id,
      'Lesson plan: '||new.title,
      new.subject||' · '||new.grade||' · '||new.date
    );
  end if;
  return new;
end;
$$;
drop trigger if exists trg_enqueue_lesson_approval on public.lessons;
create trigger trg_enqueue_lesson_approval
after insert or update of status on public.lessons
for each row execute function public.enqueue_lesson_approval();

-- New training entries submitted by the UI enter the Training Approval workflow.
create or replace function public.enqueue_training_approval()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.approval_status='Pending' then
    perform public.enqueue_default_approval(
      'training',new.id,
      'Training: '||new.title,
      new.provider||' · '||new.date
    );
  end if;
  return new;
end;
$$;
drop trigger if exists trg_enqueue_training_approval on public.training;
create trigger trg_enqueue_training_approval
after insert on public.training
for each row execute function public.enqueue_training_approval();

-- When a workflow finishes, synchronize the real domain record.
create or replace function public.sync_approval_result_to_entity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status not in ('Approved','Rejected') or old.status is not distinct from new.status then
    return new;
  end if;

  if new.entity_type='leave' and new.entity_id is not null then
    update public.leave_requests
      set status=new.status,
          reviewed_by=auth.uid(),
          reviewed_at=coalesce(new.completed_at,now())
    where id=new.entity_id;

  elsif new.entity_type='lesson_plan' and new.entity_id is not null then
    update public.lessons
      set status=new.status,
          approved_by=case when new.status='Approved' then auth.uid() else approved_by end,
          approved_at=coalesce(new.completed_at,now())
    where id=new.entity_id;

  elsif new.entity_type='training' and new.entity_id is not null then
    update public.training
      set approval_status=new.status
    where id=new.entity_id;
  end if;

  return new;
end;
$$;
drop trigger if exists trg_sync_approval_result_to_entity on public.approval_requests;
create trigger trg_sync_approval_result_to_entity
after update of status on public.approval_requests
for each row execute function public.sync_approval_result_to_entity();

-- Existing pending records are intentionally not backfilled automatically because SQL Editor
-- sessions do not have an auth.uid(). Create a workflow request manually for any old pending
-- record that should enter the new integrated workflow.
