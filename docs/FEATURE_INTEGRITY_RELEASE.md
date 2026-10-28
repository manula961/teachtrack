# TeachTrack — feature integrity release plan

Created: 2026-10-28. PR: https://github.com/manula961/teachtrack/pull/3

## Scope

- SQL: `supabase/feature-integrity-approval-qr.sql`
- Regression test (rollback-only, **not** yet executed): `supabase/tests/feature-integrity-regression.sql`
- API functions added after SQL migration: `review_approval_request`, `checkin_qr_attendance`, `submit_lesson_plan`, `reconcile_pending_lessons`.
- Changes to approval, QR, lesson, training, goal, export and performance screens.

## Release safety

**Do not merge before confirming whether NEXENTIA 26 permits post-deadline changes.**
The original submission can be disqualified if modified after the deadline.

The migration is **not applied**. It revokes direct database permissions that
the currently deployed frontend still relies upon. To prevent broken screens,
perform a coordinated release with a maintenance window (or split the SQL into
a compatibility migration and a final lockdown migration).

1. Back up the production Supabase database (schema and data), record the Git
   commit SHA, and choose a rollback release window.
2. On a disposable Supabase staging environment with fake accounts, apply the
   migration. Never copy genuine teacher or student personal information there.
3. Run `supabase/tests/feature-integrity-regression.sql`. It requires demo
   accounts and rolls back all test records.
4. Run the new frontend against staging. Test all approval stages, rejection,
   expired QR, valid QR, duplicate check-ins, attendance sync, edits and
   certificate verification.
5. Verify the new authorization behavior from a real unprivileged JWT, not
   only from the admin SQL Editor.
6. Deploy the verified code and apply the SQL migration in a coordinated
   window. Check `/api/health` and use the demo accounts.
7. Inspect logs and run Supabase's security and performance advisors again.
8. Have a documented restoration/rollback plan; do not blindly roll back
   only one side of the application/database contract.

## Protected workflow contracts

### Approvals
- `approval_actions` INSERT and `approval_requests` UPDATE are no longer
  directly granted to signed-in users.
- A SQL command atomically checks the actual role, assigned workflow step,
  request state and current stage, creates an action, and advances the request.
- A Principal override is retained intentionally.
- Decisions synchronize to leave, lesson or training entity status via the
  existing database trigger.

### QR attendance
- Teachers can no longer list QR session codes.
- Short-lived, cryptographically random codes are checked in a database routine.
- The database checks teacher identity, active/open window and school-local date.
- Each successful QR check-in updates the teacher's attendance row to Present
  and records arrival time; it may replace a previously entered absence for
  that date. School policy must define a correction/reconciliation process.

### Lesson drafts, training and leave
- Direct status changes bypassing approvals are blocked.
- Teachers may edit their own draft content and submit it through
  `submit_lesson_plan`.
- Managers can verify completed, approved training certificates only when a
  certificate evidence URL is recorded.
- A Principal/Vice Principal can explicitly requeue legacy Pending lesson
  records, with their own identity recorded rather than pretending to be
  the unknown original requester.

### Performance scoring
- One shared observed-evidence composite is now used on teacher directory,
  analytics, dashboards, portfolios, leadership presentation, comparisons and
  gamification features.
- Missing observation/lesson/feedback data no longer receives an optimistic
  score. Unassessed teachers are labeled and excluded from award rankings.
- The database's original `teachers_dashboard.performance_score` remains
  available as a **legacy** metric, and third-party consumers of that field
  must migrate to the UI's canonical formula or a future server-side shared
  calculation.
- Scores are descriptive development indicators, not validated measures of
  teacher quality or a basis for high-stakes personnel decisions.

## Outstanding school-owner / longer-term tasks

- Decide and configure teacher assignments for Section Heads and Reviewers;
  do not grant blanket access to private teacher records.
- Verify one unlinked Auth teacher's identity before associating a teacher row.
- Enable Supabase leaked-password protection in Auth settings.
- Confirm public Principal demo credentials only access fictional data.
- Run authenticated Google Drive, timetable scheduling, mentoring,
  notification, school-year promotion, and full workflow browser tests in
  staging.
- Replace the global provider's broad multi-table data fetch with query-level
  pagination and module-specific data loaders.
- Review existing certificate/document metadata validation and external URLs.
- Validate the migration against real Postgres; passing the Next.js build
  does not validate the SQL migration.

## QA status at preparation

Production remains at previously verified main commit `5617488e` until
the owner explicitly releases this feature-integrity PR. Browser smoke and
quality checks run in GitHub Actions on the PR, but without a staging database
they cannot validate the new RPC permission rules.

## Historical certificate audit

Four existing training rows currently have `certificate_verified=true` but
no `certificate_url`. The new verification trigger only checks **newly
granted** verification; it intentionally does not invalidate or block
unrelated edits to legacy records. The management training screen now lists
these cases so school leadership can attach an HTTPS evidence link, clear the
legacy flag and re-verify. Do not silently remove historical verification
statuses or fabricate certificate evidence.

## Remaining risk and evidence collection

The proposed SQL is code-reviewed but has not been applied to a staging or
production database in this turn. A successful Next.js build and public-page
browser audit are not substitutes for the rollback-only SQL role test.
