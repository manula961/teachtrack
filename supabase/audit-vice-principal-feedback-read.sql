-- Fix leadership read/write mismatch discovered by role-impersonated SQL audit.
-- Vice Principals could INSERT feedback but could not SELECT feedback.
-- Preserve teacher self-read and do not grant reviewers broad feedback access.
ALTER POLICY "feedback admin or self read" ON public.feedback
  USING ((select public.is_manager()) OR teacher_id = (select public.my_teacher_id()));
