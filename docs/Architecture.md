# ofy-kibble-capital Architecture

Student financial literacy platform: payroll/earnings, banking/vaults, and teacher store POS — **one codebase**, three mobile-first PWAs on a shared Convex backend.

## Stack

- App: TanStack Start + React 19 + TypeScript
- Package manager / scripts: Bun (`bun.lock` only)
- Styling: Tailwind CSS v4
- Backend: Convex (queries, mutations, real-time)
- Deploy: Netlify (TanStack Start + `convex deploy` in build)
- Auth: Convex Auth (Google `@ofy.org`), `@djpanda/convex-tenants`, `@djpanda/convex-authz`, invitation-only — see [`docs/ai/auth.md`](ai/auth.md)
- UI: shadcn (Base UI) + semantic tokens; Stitch-aligned polish deferred to slice 11

## Route surfaces (planned)

| Surface         | Path prefix | Role                                  |
| --------------- | ----------- | ------------------------------------- |
| Kibble Capital  | `/kibble/*` | Accounting-style student PWA          |
| PawKet Exchange | `/pawket/*` | Banking-style student PWA             |
| Teacher admin   | `/admin/*`  | Classrooms, payroll inputs, store POS |

Dual PWA manifests (scoped `start_url` / `theme_color` per app) on one origin — see the greenfield plan.

## Major areas

| Area              | Location                                           | Role                                                      |
| ----------------- | -------------------------------------------------- | --------------------------------------------------------- |
| Routes            | `src/routes/`                                      | File-based TanStack Router / Start routes                 |
| Client            | `src/router.tsx`, `src/styles/`, `src/components/` | App shell, styles, UI ([`docs/ai/react.md`](ai/react.md)) |
| Teacher admin UI  | `src/components/admin/`, `src/routes/admin/`       | Hub shell, roster, settings, wireframe absences/store     |
| Student apps      | `src/routes/kibble/`, `src/routes/pawket/`         | Kibble and PawKet route trees (PawKet banking in slice 3) |
| Backend           | `convex/features/`                                 | Auth, tenants, invitations, roster, settings, admin       |
| Dev orchestration | `scripts/dev.ts`                                   | Convex + Vite (+ optional Stitch MCP proxy)               |
| Config            | `vite.config.ts`, `netlify.toml`                   | Build; Netlify plugin on `vite build` only                |

## Implementation status (Mar 2026)

| Slice              | Status          | Notes                                                                                     |
| ------------------ | --------------- | ----------------------------------------------------------------------------------------- |
| 1 Foundation       | **Mostly done** | Auth, tenants, seed, route shells, Storybook bootstrap, `classSettings`                   |
| 2 Roster & invites | **Mostly done** | Invite/accept/resend/revoke, pay tokens, roster UI; POS pending check deferred to slice 8 |
| 3 Banking shell    | **Next**        | `bankAccounts` provisioned at invite; `ledgerEntries` and PawKet UI not yet wired         |
| 4–11               | Pending         | Per [`docs/scope/README.md`](scope/README.md)                                             |

**Teacher admin** ships a responsive shell (`AdminShell`): sidebar + mobile top bar, classroom switcher, pinned account menu, and tabs for **Roster** (live Convex data), **Settings** (persisted `classSettings`), **Absences** and **Student store** (wireframe mock data until slices 7–8).

## SSR scope

- **SSR:** public marketing landings for Kibble and PawKet (`/kibble/landing`, `/pawket/landing`).
- **Client-first:** signed-in student apps, auth flows, teacher admin (`/admin/*`), and all Convex Auth surfaces.

## Workflows

- Local dev: `bun run dev`
- Format + lint fix: `bun run format` or `bun run check`
- Production build: `bun run build`
- Typecheck: `bun run typecheck`
- Component catalog: `bun run storybook` — primitives, loaders, `AppTheme` decorators; expand through slices 2–11; see [UI build policy](scope/README.md#ui-build-policy)

## Git branches

- **`main`** — primary development; not production.
- **`production`** — intentional releases only (stub commit/tag on promote). See [`docs/ai/git-workflow.md`](ai/git-workflow.md).

## Canonical guidance

- Architecture constraints: [`docs/ai/architecture-foundation.md`](ai/architecture-foundation.md) and [`AGENTS.md`](../AGENTS.md)
- Convex: [`docs/ai/convex.md`](ai/convex.md) and `convex/_generated/ai/guidelines.md`
- Full product/technical plan: [`docs/greenfield_stack_and_architecture.plan.md`](greenfield_stack_and_architecture.plan.md)
- Domain glossary: [`CONTEXT.md`](../CONTEXT.md)
- Architecture decisions: [`docs/adr/`](adr/)
- Implementation slices: [`docs/scope/`](scope/)
