-- TeachTrack optional text defaults hardening
-- Safe to run on an existing database.
-- Prevents optional department descriptions from rejecting blank form values.

update public.departments
set description = ''
where description is null;

alter table public.departments
  alter column description set default '';

-- Keep NOT NULL: blank descriptions are represented by an empty string.
alter table public.departments
  alter column description set not null;
