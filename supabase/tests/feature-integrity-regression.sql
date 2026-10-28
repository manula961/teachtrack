-- Run ONLY after deploying feature-integrity-approval-qr.sql to a staging DB
-- with fictional demo accounts. The entire test transaction is rolled back.
BEGIN;
SELECT set_config('tt_test_principal',(SELECT id::text FROM auth.users WHERE email='demo.principal@school.lk'),true);
SELECT set_config('tt_test_vp',(SELECT id::text FROM auth.users WHERE email='demo.vp@school.lk'),true);
SELECT set_config('tt_test_section',(SELECT id::text FROM auth.users WHERE email='demo.section@school.lk'),true);
SELECT set_config('tt_test_teacher',(SELECT id::text FROM auth.users WHERE email='demo.teacher@school.lk'),true);
DO $$
BEGIN
 IF current_setting('tt_test_principal',true) IS NULL OR
    current_setting('tt_test_vp',true) IS NULL OR
    current_setting('tt_test_section',true) IS NULL OR
    current_setting('tt_test_teacher',true) IS NULL
 THEN RAISE EXCEPTION 'Required demo identities are not configured'; END IF;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('tt_test_teacher'),true);
WITH wf AS (
 SELECT id FROM public.approval_workflows WHERE entity_type='general' AND active=true LIMIT 1
), created AS (
 INSERT INTO public.approval_requests(workflow_id,entity_type,title)
 SELECT wf.id,'general','Temporary integration test request' FROM wf RETURNING id
)
SELECT set_config('tt_test_request',(SELECT id::text FROM created),true);

-- Teacher cannot skip the first approval stage or directly mutate the request.
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.review_approval_request(current_setting('tt_test_request')::bigint,'Approved','');
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Teacher bypassed stage authorization'; END IF;
 IF has_table_privilege('authenticated','public.approval_requests','UPDATE') THEN
  RAISE EXCEPTION 'Direct request UPDATE remains granted';
 END IF;
END $$;

-- Each role approves only its assigned step.
SELECT set_config('request.jwt.claim.sub',current_setting('tt_test_section'),true);
SELECT public.review_approval_request(current_setting('tt_test_request')::bigint,'Approved','Section review complete');
DO $$ BEGIN
 IF (SELECT current_step FROM public.approval_requests WHERE id=current_setting('tt_test_request')::bigint)<>1
 THEN RAISE EXCEPTION 'Section stage not advanced'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub',current_setting('tt_test_vp'),true);
SELECT public.review_approval_request(current_setting('tt_test_request')::bigint,'Approved','VP review complete');
SELECT set_config('request.jwt.claim.sub',current_setting('tt_test_principal'),true);
SELECT public.review_approval_request(current_setting('tt_test_request')::bigint,'Approved','Final approval');
DO $$ BEGIN
 IF (SELECT status FROM public.approval_requests WHERE id=current_setting('tt_test_request')::bigint)<>'Approved'
 THEN RAISE EXCEPTION 'Workflow not completed'; END IF;
 IF (SELECT count(*) FROM public.approval_actions WHERE request_id=current_setting('tt_test_request')::bigint)<>3
 THEN RAISE EXCEPTION 'Approval action log incomplete'; END IF;
END $$;

-- The Principal can create two temporary QR sessions.
WITH ins AS (
 INSERT INTO public.qr_attendance_sessions(session_date,code,opens_at,closes_at,active)
 VALUES((now() AT TIME ZONE 'Asia/Colombo')::date,
        'TT-TEST-VALID-'||upper(left(md5(random()::text),20)),now()-interval '1 minute',now()+interval '15 minutes',true)
 RETURNING code
)
SELECT set_config('tt_valid_code',(SELECT code FROM ins),true);
WITH ins AS (
 INSERT INTO public.qr_attendance_sessions(session_date,code,opens_at,closes_at,active)
 VALUES((now() AT TIME ZONE 'Asia/Colombo')::date,
        'TT-TEST-EXPIRED-'||upper(left(md5(random()::text),20)),now()-interval '3 hours',now()-interval '2 hours',true)
 RETURNING code
)
SELECT set_config('tt_expired_code',(SELECT code FROM ins),true);

SELECT set_config('request.jwt.claim.sub',current_setting('tt_test_teacher'),true);
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN PERFORM public.checkin_qr_attendance(current_setting('tt_expired_code'));
 EXCEPTION WHEN SQLSTATE '22023' THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Expired QR session accepted'; END IF;
 IF (SELECT count(*) FROM public.qr_attendance_sessions)<>0
 THEN RAISE EXCEPTION 'A teacher can still enumerate QR session codes'; END IF;
END $$;
SELECT public.checkin_qr_attendance(current_setting('tt_valid_code'));
DO $$ BEGIN
 IF NOT EXISTS(
  SELECT 1 FROM public.attendance
  WHERE teacher_id=public.my_teacher_id()
    AND date=(now() AT TIME ZONE 'Asia/Colombo')::date AND status='Present'
 ) THEN
  RAISE EXCEPTION 'Valid QR check-in did not synchronize attendance';
 END IF;
END $$;
ROLLBACK;
