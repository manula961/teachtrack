# TeachTrack audit remediation — 28 October 2026

## Applied to connected Supabase project

- Executed `supabase/audit-security-performance-2026-10-28.sql`.
- Revoked privileged-function execution from `PUBLIC` and `anon`.
- Retained `authenticated` execution for eight RLS / role-management helper functions only.
- Added indexes for frequent teacher-scoped filtering.
- Verified privileged functions callable by `anon`: **0** (previously 19).
- Verified privileged functions callable by `authenticated`: **8** (previously 19).
- Verified all 50 public base tables have RLS enabled.

## Application fixes on audit branch

- Limited concurrent dashboard-wide database requests to reduce burst load.
- Check affected row counts after UPDATE / DELETE so denied operations do not show a false success.
- Handle lesson-plan submission errors and prevent duplicate submissions.
- Add a TypeScript check and GitHub Actions build-validation workflow.

## Outstanding work and non-automatable checks

1. The five public demonstration accounts are intentionally published for judges. They must be confined to fake data. Rotate/remove them before school production use.
2. Supabase leaked-password protection is disabled; enable it in the Supabase Authentication settings and verify settings with the security advisor.
3. One teacher-role profile is missing its teacher link. Link only after confirming the correct real identity (do not guess).
4. RLS efficiency warnings, overlapping policies, and additional FK indexes should be reviewed individually; preserving policy semantics is essential.
5. Verify login, all five roles, teacher isolation, approvals, documents, CSV export, mobile behavior, and Google Drive evidence with controlled E2E tests.
6. The global provider still fetches a broad dataset. Replace this with per-module server-side pagination as a larger architectural refactor.
7. Ensure any modifications to the competition's final submitted commit comply with deadline and no-change rules.

## Deployment & testing notes

This branch is **not** automatically a production release. Review CI and Vercel preview deployment before merging. The existing Vercel production deployment remains pinned to the previously verified main-branch SHA.
