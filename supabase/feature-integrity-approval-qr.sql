-- TeachTrack workflow integrity and QR attendance hardening.
-- IMPORTANT: deploy the matching application changes together with this migration.
-- Existing student/staff records are not changed by this migration.

CREATE SCHEMA IF NOT EXISTS tt_internal;
REVOKE ALL ON SCHEMA tt_internal FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA tt_internal TO authenticated;

-- An atomic approval command. This is deliberately placed in a schema NOT
-- exposed by PostgREST. Its public RPC wrapper is SECURITY INVOKER.
CREATE OR REPLACE FUNCTION tt_internal.review_approval_request(
  p_request_id bigint, p_decision text, p_comment text DEFAULT ''
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  v_req public.approval_requests%ROWTYPE;
  v_wf public.approval_workflows%ROWTYPE;
  v_role text;
  v_expected text;
  v_step_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';
  END IF;
  IF p_decision NOT IN ('Approved','Rejected') THEN
    RAISE EXCEPTION 'Invalid approval decision' USING ERRCODE='22023';
  END IF;
  IF length(coalesce(p_comment,'')) > 2000 THEN
    RAISE EXCEPTION 'Approval comment is too long' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_req FROM public.approval_requests
  WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND OR v_req.status <> 'Pending' THEN
    RAISE EXCEPTION 'Approval request is not pending' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_wf FROM public.approval_workflows
  WHERE id=v_req.workflow_id AND active=true;
  IF NOT FOUND OR v_wf.entity_type IS DISTINCT FROM v_req.entity_type THEN
    RAISE EXCEPTION 'An active matching workflow is required' USING ERRCODE='22023';
  END IF;
  v_step_count := jsonb_array_length(v_wf.steps);
  IF v_step_count=0 OR v_req.current_step < 0 OR v_req.current_step >= v_step_count THEN
    RAISE EXCEPTION 'Invalid approval workflow stage' USING ERRCODE='22023';
  END IF;
  v_role := public.current_role()::text;
  v_expected := v_wf.steps->>v_req.current_step;
  IF v_role IS NULL OR (v_role <> 'principal' AND v_role <> v_expected) THEN
    RAISE EXCEPTION 'This stage requires the assigned reviewer' USING ERRCODE='42501';
  END IF;

  INSERT INTO public.approval_actions(request_id,actor_id,actor_role,action,comment)
  VALUES (v_req.id,auth.uid(),v_role,p_decision,coalesce(p_comment,''));

  IF p_decision='Rejected' THEN
    UPDATE public.approval_requests
    SET status='Rejected',completed_at=now()
    WHERE id=v_req.id;
  ELSIF v_role='principal' OR v_req.current_step+1 >= v_step_count THEN
    UPDATE public.approval_requests
    SET status='Approved',completed_at=now()
    WHERE id=v_req.id;
  ELSE
    UPDATE public.approval_requests
    SET current_step=v_req.current_step+1 WHERE id=v_req.id;
  END IF;
END;$$;

REVOKE ALL ON FUNCTION tt_internal.review_approval_request(bigint,text,text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION tt_internal.review_approval_request(bigint,text,text)
TO authenticated;

CREATE OR REPLACE FUNCTION public.review_approval_request(
  p_request_id bigint, p_decision text, p_comment text DEFAULT ''
) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog
AS $$ SELECT tt_internal.review_approval_request(p_request_id,p_decision,p_comment); $$;

REVOKE ALL ON FUNCTION public.review_approval_request(bigint,text,text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_approval_request(bigint,text,text)
TO authenticated;

-- Only the validated atomic RPC may record actions or advance stages.
REVOKE UPDATE ON TABLE public.approval_requests FROM PUBLIC, anon, authenticated;
REVOKE INSERT ON TABLE public.approval_actions FROM PUBLIC, anon, authenticated;

-- QR check-ins resolve an unpredictable code in a private routine, and never
-- expose live codes to teacher users through the session table.
CREATE OR REPLACE FUNCTION tt_internal.checkin_qr_attendance(p_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $$
DECLARE
  v_teacher bigint;
  v_session public.qr_attendance_sessions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';
  END IF;
  v_teacher := public.my_teacher_id();
  IF v_teacher IS NULL THEN
    RAISE EXCEPTION 'Verified teacher account required' USING ERRCODE='42501';
  END IF;
  IF length(trim(coalesce(p_code,'')))<12 THEN
    RAISE EXCEPTION 'Invalid attendance code' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_session FROM public.qr_attendance_sessions
  WHERE upper(code)=upper(trim(p_code))
    AND active=true AND opens_at<=now() AND closes_at>now()
    AND session_date=(now() AT TIME ZONE 'Asia/Colombo')::date
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance code is invalid, expired or not yet open'
    USING ERRCODE='22023';
  END IF;
  INSERT INTO public.qr_attendance_checkins(session_id,teacher_id,checked_in_at)
  VALUES(v_session.id,v_teacher,now());
END; $$;
REVOKE ALL ON FUNCTION tt_internal.checkin_qr_attendance(text)
FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION tt_internal.checkin_qr_attendance(text)
TO authenticated;

CREATE OR REPLACE FUNCTION public.checkin_qr_attendance(p_code text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog
AS $$SELECT tt_internal.checkin_qr_attendance(p_code);$$;
REVOKE ALL ON FUNCTION public.checkin_qr_attendance(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.checkin_qr_attendance(text) TO authenticated;

REVOKE INSERT ON TABLE public.qr_attendance_checkins FROM PUBLIC,anon,authenticated;
DROP POLICY IF EXISTS "qr sessions read" ON public.qr_attendance_sessions;
CREATE POLICY "qr sessions management read"
ON public.qr_attendance_sessions FOR SELECT TO authenticated
USING ((select public.is_manager()));

-- Defense in depth if check-ins are inserted by another privileged integration.
CREATE OR REPLACE FUNCTION tt_internal.validate_qr_checkin()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog
AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.teacher_id IS DISTINCT FROM public.my_teacher_id()
  THEN RAISE EXCEPTION 'Teacher cannot check in for another user'
    USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(
    SELECT 1 FROM public.qr_attendance_sessions s WHERE s.id=NEW.session_id
    AND s.active AND s.opens_at<=now() AND s.closes_at>now()
    AND s.session_date=(now() AT TIME ZONE 'Asia/Colombo')::date
  ) THEN
    RAISE EXCEPTION 'QR attendance session is not active'
    USING ERRCODE='22023';
  END IF;
  NEW.checked_in_at:=now();
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION tt_internal.sync_qr_checkin_to_attendance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $$
DECLARE v_date date;
BEGIN
  SELECT session_date INTO v_date FROM public.qr_attendance_sessions
  WHERE id=NEW.session_id;
  INSERT INTO public.attendance(teacher_id,date,status,arrival_time)
  VALUES(
    NEW.teacher_id, v_date, 'Present',
    (NEW.checked_in_at AT TIME ZONE 'Asia/Colombo')::time
  )
  ON CONFLICT (teacher_id,date) DO UPDATE
  SET status='Present', arrival_time=excluded.arrival_time;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION tt_internal.sync_qr_checkin_to_attendance()
FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS trg_validate_qr_checkin ON public.qr_attendance_checkins;
CREATE TRIGGER trg_validate_qr_checkin BEFORE INSERT
ON public.qr_attendance_checkins FOR EACH ROW
EXECUTE FUNCTION tt_internal.validate_qr_checkin();

DROP TRIGGER IF EXISTS trg_sync_qr_attendance ON public.qr_attendance_checkins;
CREATE TRIGGER trg_sync_qr_attendance AFTER INSERT
ON public.qr_attendance_checkins FOR EACH ROW
EXECUTE FUNCTION tt_internal.sync_qr_checkin_to_attendance();

-- Limit stale repeat submissions even if the frontend retries.
CREATE INDEX IF NOT EXISTS idx_tt_qr_sessions_validity
ON public.qr_attendance_sessions(code,active,closes_at);

-- Prevent bypass of the approval engine by setting entity statuses directly.
-- Only safe non-decision columns remain writable by signed-in users.
REVOKE UPDATE ON TABLE public.lessons FROM PUBLIC,anon,authenticated;
GRANT UPDATE (title,subject,grade,date,objective) ON public.lessons TO authenticated;
REVOKE UPDATE ON TABLE public.training FROM PUBLIC,anon,authenticated;
GRANT UPDATE (title,provider,date,hours,status,expiry_date,certificate_url,certificate_verified)
ON public.training TO authenticated;
REVOKE UPDATE ON TABLE public.leave_requests FROM PUBLIC,anon,authenticated;
GRANT UPDATE (leave_type,start_date,end_date,reason) ON public.leave_requests TO authenticated;

ALTER POLICY "lessons self insert" ON public.lessons
WITH CHECK ((public.is_manager() OR teacher_id=public.my_teacher_id())
  AND status IN ('Draft','Pending'));
ALTER POLICY "training manager write insert" ON public.training
WITH CHECK (public.is_manager() AND approval_status='Pending'
  AND certificate_verified=false);
ALTER POLICY "leave own create" ON public.leave_requests
WITH CHECK ((teacher_id=public.my_teacher_id() OR public.is_manager())
  AND status='Pending');
ALTER POLICY "approval requests create" ON public.approval_requests
WITH CHECK (requested_by=(select auth.uid()) AND status='Pending'
  AND current_step=0 AND completed_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.approval_workflows wf
    WHERE wf.id=workflow_id AND wf.active=true AND wf.entity_type=approval_requests.entity_type
  )
  AND (
    entity_id IS NULL OR
    entity_type NOT IN ('lesson_plan','training','leave') OR
    (entity_type='lesson_plan' AND EXISTS(
      SELECT 1 FROM public.lessons l WHERE l.id=entity_id
      AND (l.teacher_id=public.my_teacher_id() OR public.is_manager())
    )) OR
    (entity_type='training' AND EXISTS(
      SELECT 1 FROM public.training t WHERE t.id=entity_id
      AND (t.teacher_id=public.my_teacher_id() OR public.is_manager())
    )) OR
    (entity_type='leave' AND EXISTS(
      SELECT 1 FROM public.leave_requests l WHERE l.id=entity_id
      AND (l.teacher_id=public.my_teacher_id() OR public.is_manager())
    ))
  ));

-- Only the owner may submit an existing draft for approval.
CREATE OR REPLACE FUNCTION tt_internal.submit_lesson_plan(p_lesson_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $$
DECLARE v_lesson public.lessons%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL THEN
   RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';
 END IF;
 SELECT * INTO v_lesson FROM public.lessons WHERE id=p_lesson_id FOR UPDATE;
 IF NOT FOUND OR v_lesson.status<>'Draft' THEN
   RAISE EXCEPTION 'Only drafts can be submitted' USING ERRCODE='22023';
 END IF;
 IF v_lesson.teacher_id IS DISTINCT FROM public.my_teacher_id() AND NOT public.is_manager() THEN
   RAISE EXCEPTION 'Not your lesson plan' USING ERRCODE='42501';
 END IF;
 UPDATE public.lessons SET status='Pending' WHERE id=p_lesson_id;
END;$$;
REVOKE ALL ON FUNCTION tt_internal.submit_lesson_plan(bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION tt_internal.submit_lesson_plan(bigint) TO authenticated;
CREATE OR REPLACE FUNCTION public.submit_lesson_plan(p_lesson_id bigint)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog
AS $$SELECT tt_internal.submit_lesson_plan(p_lesson_id);$$;
REVOKE ALL ON FUNCTION public.submit_lesson_plan(bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_lesson_plan(bigint) TO authenticated;

-- Certificate verification needs evidence, a completed course, and approval.
CREATE OR REPLACE FUNCTION tt_internal.validate_certificate_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.certificate_verified AND (
   NEW.certificate_url IS NULL OR btrim(NEW.certificate_url)='' OR
   NEW.status<>'Completed' OR NEW.approval_status<>'Approved'
 ) THEN
   RAISE EXCEPTION 'Certificate verification requires approved completed training and evidence'
     USING ERRCODE='22023';
 END IF;
 RETURN NEW;
END;$$;
REVOKE ALL ON FUNCTION tt_internal.validate_certificate_verification()
FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_validate_training_certificate ON public.training;
CREATE TRIGGER trg_validate_training_certificate BEFORE INSERT OR UPDATE
ON public.training FOR EACH ROW
EXECUTE FUNCTION tt_internal.validate_certificate_verification();

-- Prevent duplicate active approval records while allowing resubmission history.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tt_one_pending_request_per_entity
ON public.approval_requests(entity_type,entity_id)
WHERE entity_id IS NOT NULL AND status='Pending';

-- Migration-era records can have status Pending without a queued workflow.
-- Requeue explicitly as the current principal/vice principal, never claiming
-- to be the unverified original requester.
CREATE OR REPLACE FUNCTION tt_internal.reconcile_pending_lessons()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $$
DECLARE v_workflow bigint; v_count integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_manager() THEN
   RAISE EXCEPTION 'School leadership permissions required' USING ERRCODE='42501';
 END IF;
 SELECT id INTO v_workflow FROM public.approval_workflows
 WHERE entity_type='lesson_plan' AND active ORDER BY id LIMIT 1;
 IF v_workflow IS NULL THEN
   RAISE EXCEPTION 'No active lesson approval workflow' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.approval_requests(
  workflow_id,entity_type,entity_id,title,description,requested_by,current_step,status
 )
 SELECT v_workflow,'lesson_plan',l.id,'Lesson plan: '||l.title,
  'Legacy pending lesson requeued for review by school leadership; original requester not inferred.',
  auth.uid(),0,'Pending'
 FROM public.lessons l
 WHERE l.status='Pending' AND NOT EXISTS(
  SELECT 1 FROM public.approval_requests ar
  WHERE ar.entity_type='lesson_plan' AND ar.entity_id=l.id AND ar.status='Pending'
 )
 ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS v_count=ROW_COUNT;
 RETURN v_count;
END;$$;
REVOKE ALL ON FUNCTION tt_internal.reconcile_pending_lessons() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION tt_internal.reconcile_pending_lessons() TO authenticated;
CREATE OR REPLACE FUNCTION public.reconcile_pending_lessons()
RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog
AS $$SELECT tt_internal.reconcile_pending_lessons();$$;
REVOKE ALL ON FUNCTION public.reconcile_pending_lessons() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reconcile_pending_lessons() TO authenticated;

-- No public trigger routines should have direct function execution grants.
REVOKE ALL ON FUNCTION tt_internal.validate_qr_checkin() FROM PUBLIC,anon,authenticated;
