# BAGPSI Manajemen Akun v0.6

## Keputusan user
- Create account: Admin supplies a temporary password.
- Deactivation: disable/ban, not delete; data is retained.
- Role changes: require confirmation.
- Last active Admin cannot be demoted or disabled.

## Included
- `pages/admin/users.html`: responsive account-management UI.
- `css/admin/users.css`: page styling; existing `css/admin/admin.css` remains required.
- `js/admin/users-page.js`: search, role/status filters, pagination, create, role confirmation, enable/disable.
- `js/admin/admin.js`: routes the `users` page to the dedicated module.
- `supabase/functions/admin-users/index.ts`: server-side list/create/update-role/set-status.
- `supabase/migrations/20261127_admin_account_management_draft.sql`: draft additive schema.

## Install frontend
Merge `pages/`, `css/`, and `js/` into the repository root. Do not replace unrelated application files. Commit and push.

## Backend prerequisites — not deployed
1. Review current Supabase schema, RLS, grants, functions and triggers.
2. Review the migration draft on staging before applying.
3. Deploy Edge Function `admin-users`.
4. Configure server secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; service role must never be put in browser code.
5. Verify `is_bagpsi_admin()` returns boolean true for Admin and false for User.
6. Test with staging accounts before production.

## Temporary password behavior
Admin enters the temporary password during account creation. It is sent to the Edge Function over HTTPS, used to create the Auth user, and is not returned or stored in profile/audit data. Admin must deliver it via a separate secure channel. This patch does not technically force password rotation on first login; that requires a separate first-login flag and password-change gate.

## Limitations
- Account listing and mutations require deployed Edge Function and `profiles.account_status` migration.
- Audit writes require `admin_audit_log` table.
- Audit is appended after the Auth/DB mutation. If audit insert fails, the function returns an explicit error but the preceding mutation may already have succeeded; production hardening should move critical mutations/audit into a transactional RPC/outbox pattern.
- Rate limiting, MFA/reauthentication, forced password change, and reset-password email workflow are not implemented in this patch.
- No database migration has been run and no live Supabase/browser test is claimed.

## Validation
JavaScript syntax, local imports, HTML references, and ZIP integrity are checked locally. Edge Function runtime/deployment requires Supabase environment.
