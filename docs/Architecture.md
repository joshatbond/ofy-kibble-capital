# ofy-kibble-capital Architecture

Student financial literacy platform: payroll/earnings, banking/vaults, and teacher store POS — **one codebase**, three mobile-first PWAs on a shared Convex backend.

## Stack

- App: TanStack Start + React 19 + TypeScript
- Package manager / scripts: Bun (`bun.lock` only)
- Styling: Tailwind CSS v4
- Backend: Convex (queries, mutations, real-time)
- Deploy: Netlify (TanStack Start + `convex deploy` in build)
- Auth (planned): Convex Auth, `@djpanda/convex-tenants`, `@djpanda/convex-authz`, invitation-only — see [`docs/ai/auth.md`](ai/auth.md)
- UI (planned): shadcn (Base UI) + Google Stitch templates for v1 screens

## Route surfaces (planned)

| Surface         | Path prefix | Role                                  |
| --------------- | ----------- | ------------------------------------- |
| Kibble Capital  | `/kibble/*` | Accounting-style student PWA          |
| PawKet Exchange | `/pawket/*` | Banking-style student PWA             |
| Teacher admin   | `/admin/*`  | Classrooms, payroll inputs, store POS |

Dual PWA manifests (scoped `start_url` / `theme_color` per app) on one origin — see the greenfield plan.

## Major areas (current scaffold)

| Area              | Location                                           | Role                                                      |
| ----------------- | -------------------------------------------------- | --------------------------------------------------------- |
| Routes            | `src/routes/`                                      | File-based TanStack Router / Start routes                 |
| Client            | `src/router.tsx`, `src/styles/`, `src/components/` | App shell, styles, UI ([`docs/ai/react.md`](ai/react.md)) |
| Backend           | `convex/`                                          | Schema and functions                                      |
| Dev orchestration | `scripts/dev.ts`                                   | Convex + Vite (+ optional Stitch MCP proxy)               |
| Config            | `vite.config.ts`, `netlify.toml`                   | Build; Netlify plugin on `vite build` only                |

## SSR scope (planned)

- **SSR:** public marketing landings for Kibble and PawKet only.
- **Client-first:** signed-in student apps, auth flows, admin, and all Convex Auth surfaces.

## Workflows

- Local dev: `bun run dev`
- Format + lint fix: `bun run format` or `bun run check`
- Production build: `bun run build`
- Typecheck: `bun run typecheck`

## Canonical guidance

- Architecture constraints: [`docs/ai/architecture-foundation.md`](ai/architecture-foundation.md) and [`AGENTS.md`](../AGENTS.md)
- Convex: [`docs/ai/convex.md`](ai/convex.md) and `convex/_generated/ai/guidelines.md`
- Full product/technical plan: [`docs/greenfield_stack_and_architecture.plan.md`](greenfield_stack_and_architecture.plan.md)
