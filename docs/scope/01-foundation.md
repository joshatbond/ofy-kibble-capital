# Slice 1 — Foundation

## Goal

Convex backend and TanStack app skeleton with multi-tenant classroom model, region/site catalog, and auth wiring ready for invitation-only onboarding.

## Dependencies

- Greenfield scaffold (TanStack Start + Convex) — largely done per plan.
- Reference: **ms-engage-v2** `convex/` for tenants + authz shape (`docs/ai/auth.md`).

## Deliverables

- `@djpanda/convex-tenants` + `@djpanda/convex-authz` in `convex/convex.config.ts`
- `convex/tenants.ts`, `convex/authz.ts`, `convex/invitations.ts`, `convex/http.ts` (mirror reference patterns) — **invitations** include student/co-teacher invite, accept at `/invite/:id`, roster + pay token (slice 2 body; wired for foundation auth checklist)
- Operator tables: **Region**, **School site** (**Site slug**), link **Classroom** org to **Site slug**
- Seed script: regions/sites (`ofysb-mv`, `ofysb-sb1`, `ofysb-sb2`) + your v1 classroom org
- **Settings stack** tables: region defaults → school site → `classSettings` snapshot at classroom create
- Route shells: `/kibble`, `/pawket`, `/admin` (client-first); SSR only marketing landings
- Dual PWA manifests per app
- **Storybook** bootstrap (Vite + React): Tailwind/`app.css`, `AppTheme` decorators (`kibble`, `pawket`), `bun run storybook`; initial stories for shadcn primitives + branded loaders — see [UI build policy](./README.md#ui-build-policy) in scope README

## Acceptance criteria

- [x] Teacher role vs student role enforced on routes (students cannot hit `/admin` — `AdminAuthGate`)
- [x] **Teacher** sign-in lands on **Teacher admin**; student lands per **Sign-in surface** / invite default **Kibble**
- [x] Classroom org created only via operator seed in v1
- [x] `classSettings` holds: **Hourly rate**, **Standard day hours**, **Pay schedule**, **Savings APY**, 401(k) %, medical $, **Overtime multiplier**, **Payday notice** lead (1–7 calendar days), **Currency label**, vault cap (default 5), etc.
- [x] Storybook runs locally with Kibble and PawKet theme decorators and stories for shared primitives + both loaders

## Domain refs

- **Organization**, **Classroom**, **Region**, **School site**, **Site slug**, **Settings stack**, **Effective settings**
- ADRs: none specific; see architecture-foundation + auth docs

## Out of scope

- Pay run, ledger, store, PTO
- Resend / PWA push
