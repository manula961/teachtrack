-- TeachTrack teacher section upgrade
-- Run after competition-polish-upgrade.sql.
--
-- IMPORTANT:
-- PostgreSQL CREATE OR REPLACE VIEW requires all existing view columns to keep
-- their existing names and positions. Therefore teacher_code and section are
-- appended AFTER the original teachers_dashboard columns.

alter table public.teachers
  add column if not exists section text not null default '';

-- Preserve the original teachers_dashboard column order exactly, then append
-- teacher_code and section at the end.
create or replace view public.teachers_dashboard
with (security_invoker=true) as
select
  t.id,
  t.user_id,
  t.name,
  t.initials,
  t.subject,
  t.department,
  t.email,
  t.experience,
  t.qualification,
  t.skills,
  t.join_date,
  t.status,
  t.milestones,
  t.created_at,
  m.attendance_score,
  m.feedback_score,
  m.training_hours,
  m.lesson_count,
  round((
    m.attendance_score * .45
    + (m.feedback_score / 5 * 100) * .35
    + least(m.training_hours, 40) / 40 * 100 * .20
  )::numeric, 1) as performance_score,
  t.teacher_code,
  t.section
from public.teachers t
join public.teacher_metrics m on m.id = t.id;

grant select on public.teachers_dashboard to authenticated;
