---
name: Delegation (کفیل) system
description: User delegation feature for SuperAdmin to appoint deputies with time-limited role access.
---

## The rule
When adding new backend services, always import `pool` (default export) from `../config/db`, NOT `{ db }` (named export) — there is no named export `db`.

**Why:** Early mistake caused TypeScript compile error `Module has no exported member 'db'` which blocked the entire backend startup.

**How to apply:** In any new `*.service.ts` file, use: `import pool from '../config/db';` and call `pool.query(...)`.

## Feature structure
- `backend/src/services/delegation.service.ts` — CRUD + migration for `user_delegations` table
- `backend/src/routes/delegation.routes.ts` — GET /, GET /active, GET /check/:email, POST /, PUT /:id/deactivate, DELETE /:id
- `backend/src/server.ts` — DelegationService imported + migration called + route registered at /api/delegations
- `src/pages/Admin/DelegationManagement.tsx` — Full page for SuperAdmin; route at `/delegation`
- Route added to SettingsLayout group (SuperAdmin-only) in App.tsx
- Sidebar link added to getSuperAdminNavItems() in AppSidebar.tsx

## Schema
`user_delegations`: id, delegated_role (SUPER_ADMIN|ADMIN), delegated_user_id, delegated_user_name, delegated_user_email, delegated_by_name, start_date, end_date, reason, is_active, created_at
