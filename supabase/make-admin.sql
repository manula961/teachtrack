-- After creating your admin user in Supabase Authentication > Users,
-- replace the email below and run this statement in SQL Editor.
update public.profiles p
set role = 'admin', full_name = 'Sarah Admin'
from auth.users u
where p.id = u.id and u.email = 'YOUR_ADMIN_EMAIL@example.com';

-- Optional: link an authenticated teacher account to a seeded teacher profile.
-- Repeat with the correct email/teacher ID for each teacher account.
update public.profiles p
set teacher_id = 1, full_name = 'Maya Fernando'
from auth.users u
where p.id = u.id and u.email = 'maya@teachtrack.edu';

update public.teachers t
set user_id = u.id
from auth.users u
where t.id = 1 and u.email = 'maya@teachtrack.edu';
