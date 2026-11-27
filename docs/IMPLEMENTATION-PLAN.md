# Implementation plan

## Phase 1 — UI foundation
- Modular pages, shared navigation, responsive shell.
- Session guard and RPC admin gate.
- Read-only dashboard and report listing.

## Phase 2 — database and access audit
- Inventory tables, columns, constraints, indexes, triggers, functions, grants, RLS policies, and migrations.
- Verify current semantics of `is_bagpsi_admin()` before extending it.
- Agree role source of truth and account lifecycle.

## Phase 3 — secure server operations
- Edge Functions using server-side service-role secret.
- Admin account creation, role changes, deactivation, password reset.
- Server-side authorization, input validation, rate limiting, audit events.

## Phase 4 — report administration
- Read all reports with server-side pagination and filters.
- Controlled template migration with schema compatibility checks.
- Finalization/revision/delete workflow with explicit confirmations and audit trail.

## Phase 5 — audit, monitoring, settings
- Append-only audit log.
- System health checks that report actual checks, not hard-coded green indicators.
- Security settings enforced server-side.

## Acceptance tests
- User cannot open admin page or invoke admin Edge Functions.
- Admin can perform authorized operations; every action creates an audit record.
- Last Admin cannot be deactivated or demoted.
- Final report cannot be silently overwritten by autosave.
- Template conversion fails safely on incompatible report data.
- KAROPSI source snapshots remain immutable unless an explicit draft refresh/revision is requested.
