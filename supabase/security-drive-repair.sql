-- TeachTrack final security repair + Google Drive evidence metadata
-- Run AFTER advanced-ux-upgrade.sql.

-- F01: A teacher may edit their own pending leave request, but may not
-- self-transition it out of Pending. Approval/rejection remains leadership/workflow-owned.
drop policy if exists "leave leadership update" on public.leave_requests;
create policy "leave leadership update"
on public.leave_requests
for update
to authenticated
using (
  public.is_manager()
  or (
    teacher_id = public.my_teacher_id()
    and status = 'Pending'
  )
)
with check (
  public.is_manager()
  or (
    teacher_id = public.my_teacher_id()
    and status = 'Pending'
  )
);

-- F02: Feedback is leadership-entered data in this application.
alter table public.feedback alter column created_by set default auth.uid();

-- Bind authorship to the authenticated caller so Student/Peer/Management
-- source labels cannot be forged by a normal teacher account through the API.
drop policy if exists "feedback authenticated insert" on public.feedback;
drop policy if exists "feedback leadership insert" on public.feedback;
create policy "feedback leadership insert"
on public.feedback
for insert
to authenticated
with check (
  public.is_manager()
  and created_by = auth.uid()
);

-- F03: Observation score rows inherit the privacy boundary of their parent observation.
drop policy if exists "scores read" on public.observation_scores;
create policy "scores read"
on public.observation_scores
for select
to authenticated
using (
  public.can_review()
  or exists (
    select 1
    from public.observations o
    where o.id = observation_id
      and o.teacher_id = public.my_teacher_id()
  )
);

-- Google Drive evidence metadata. Existing Supabase-stored evidence remains valid.
alter table public.evidence_attachments
  add column if not exists storage_provider text not null default 'supabase';

alter table public.evidence_attachments
  add column if not exists drive_file_id text;

alter table public.evidence_attachments
  add column if not exists drive_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'evidence_storage_provider_check'
  ) then
    alter table public.evidence_attachments
      add constraint evidence_storage_provider_check
      check (storage_provider in ('supabase','google_drive'));
  end if;
end $$;

create index if not exists idx_evidence_drive_file
  on public.evidence_attachments(drive_file_id)
  where drive_file_id is not null;

drop policy if exists "teacher docs authenticated update" on storage.objects;
create policy "teacher docs authenticated update" on storage.objects for update to authenticated
using(bucket_id='teacher-documents' and (public.is_manager() or (storage.foldername(name))[1]=public.my_teacher_id()::text))
with check(bucket_id='teacher-documents' and (public.is_manager() or (storage.foldername(name))[1]=public.my_teacher_id()::text));



-- F04: Evidence rows must never become globally readable merely because teacher_id is null.
drop policy if exists evidence_read on public.evidence_attachments;
create policy evidence_read on public.evidence_attachments for select to authenticated using (
  public.can_review()
  or teacher_id=(select teacher_id from public.profiles where id=auth.uid())
);
