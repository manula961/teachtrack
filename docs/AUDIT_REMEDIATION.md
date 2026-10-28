# TeachTrack audit remediation — October 28, 2026

## Verified changes in the connected Supabase project

The following SQL files were committed in GitHub and applied to the live TeachTrack Supabase database:

1. `supabase/audit-security-performance-2026-10-28.sql` — restricts direct execution of privileged routines, adds teacher-scoped indexes.
2. `supabase/audit-indexes-and-rls-2026-10-28.sql` — indexes missing foreign keys, caches auth.uid() in RLS, replaces redundant permissive ALL/SELECT overlaps with equivalent explicit read and write policies.
3. `supabase/audit-vice-principal-feedback-read.sql` — permits Vice Principals to read feedback they are already authorized to manage.

Verified before → after:
- Anonymous users able to invoke SECURITY DEFINER functions: **19 → 0**
- Authenticated privileged-function grants: **19 → 8** (intentionally retained for RLS helpers and role assignment)
- Unindexed foreign keys: **57 → 0**
- auth_rls_initplan performance warnings: **24 → 0**
- Multiple permissive RLS-policy warnings: **35 → 0**
- Public base tables with RLS: **50/50**, unchanged
- Vice Principal's demo account sees feedback again: **5 existing records**

New indexes initially appear in the unused-index INFO advisory until workloads exercise them. This is expected, not proof they should be dropped.

## GitHub repair branch

- `npm audit --audit-level=moderate` reports **0 vulnerabilities** after compatible upgrades, without migrating Next.js to a breaking major version.
- Patched lockfile versions: Next.js **15.5.28**, PostCSS **8.5.32**, Sharp **0.35.5**, source-map-js **1.2.2**.
- `npm run check` and `npm run build` passed in GitHub Actions.
- DataProvider limits simultaneous table-load requests; UPDATE/DELETE verify affected row counts.
- Lesson-plan form now handles errors and duplicate submission attempts.
- GitHub Actions includes quality, npm vulnerability audit, public HTTP smoke, and public-page browser/accessibility probes.
- Live public HTTP smoke test passed **6/6**: health, both login pages, demo access, and unauthenticated redirects.
- The publicly accessible routes rendered at both 390px and 1280px with no measured horizontal overflow during initial browser checks.

## Manual, security-sensitive and fuller E2E checks remaining

### 1. Enable Supabase leaked-password protection

This is a Supabase Auth project setting, not a SQL schema setting, and the connected Supabase integration does not expose an action to change it. Open the [TeachTrack Auth configuration](https://supabase.com/dashboard/project/vldhrzunrsgnnjrmjccj/auth/providers) or the project's Authentication settings, find **Leaked Password Protection** under password security, and enable it. Verify that the Supabase Security Advisor no longer reports `auth_leaked_password_protection`. Reference: https://supabase.com/docs/guides/auth/password-security

### 2. Unlinked teacher profile

One registered user with role `teacher` has no teacher record. An exact match against verified Auth email and existing teacher emails returned **zero** matches. Do not assign them to a different person's teacher record or fabricate employment credentials. A school administrator must confirm the identity, then create the correct teacher record with matching verified email or explicitly approve a secure link.

### 3. Review/scope role access

Read-only SQL tests under the five demo identities found: Principal sees 67 teachers; Vice Principal sees 67; Teacher sees only their own one; Section Head and Reviewer see zero teacher records. That is restrictive rather than a data leak, but it can limit reviewer-facing pages. Do **not** grant reviewers access to all teacher personal data merely to fill a selector. Define which teachers each reviewer or section head is assigned to, and implement that scoped permission before opening broader teacher visibility.

### 4. Test authenticated workflows

Run isolated demo-account E2E tests for teacher CRUD, lesson approvals, feedback submission and visibility, training, leave, timetable generator, exports, and document vault. Validate all five roles, denial of cross-teacher record access, and absence of accidental writes to genuine school data.

### 5. Validate Google Drive evidence

Confirm server-side Drive credentials and folder permissions are configured in the production environment. Test upload, listing, private download, delete/rollback, 20MB limit, and unauthorized access with dummy files only.

### 6. Performance and continuous quality

The provider still reads many complete data sources. Introduce server-side pagination/segmented loaders for large schools; concurrent-request limiting is only an interim mitigation. Track query plans before dropping any currently-unused indexes, and rerun the database advisor after realistic usage.

### 7. Competition submission

Competition rules warn against changing the final submitted version after the deadline. Review all GitHub PRs and preview deployments before promotion. A repair-branch push does not automatically update the production site.
