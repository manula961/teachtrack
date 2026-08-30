-- TeachTrack: Department/Class relationship upgrade
-- Safe to run on an existing database after timetable_classes and departments exist.

alter table public.timetable_classes
  add column if not exists department_id bigint
  references public.departments(id)
  on delete set null;

create index if not exists timetable_classes_department_id_idx
  on public.timetable_classes(department_id);

-- Existing timetable_classes RLS policies continue to control writes.
-- No class records are duplicated; Departments and Classes & Grades share
-- the same timetable_classes rows.
