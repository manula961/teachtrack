-- TeachTrack audit hardening, 2026-10-28.
-- Limit direct calls to privileged routines while retaining policy helpers for signed-in users.
-- Trigger and event-trigger routines are not intended to be called via PostgREST.
DO $audit$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   f.nspname, f.proname, f.args);
  END LOOP;
END $audit$;

-- Policies call these helpers as the authenticated user; they still apply row
-- ownership and/or role checks. set_user_role validates the caller internally.
GRANT EXECUTE ON FUNCTION public.can_review() TO authenticated;
GRANT EXECUTE ON FUNCTION public."current_role"() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_teacher_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid,public.app_role) TO authenticated;

-- Index the common teacher-scoped operations used throughout dashboards.
CREATE INDEX IF NOT EXISTS idx_tt_attendance_teacher_date ON public.attendance(teacher_id,date DESC);
CREATE INDEX IF NOT EXISTS idx_tt_training_teacher_date ON public.training(teacher_id,date DESC);
CREATE INDEX IF NOT EXISTS idx_tt_feedback_teacher_date ON public.feedback(teacher_id,date DESC);
CREATE INDEX IF NOT EXISTS idx_tt_lessons_teacher_date ON public.lessons(teacher_id,date DESC);
CREATE INDEX IF NOT EXISTS idx_tt_observations_teacher ON public.observations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tt_goals_teacher ON public.goals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tt_achievements_teacher ON public.achievements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tt_evidence_teacher ON public.evidence_attachments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tt_documents_teacher ON public.teacher_documents(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tt_leave_teacher ON public.leave_requests(teacher_id);
