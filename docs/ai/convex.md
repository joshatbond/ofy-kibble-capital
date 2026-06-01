# Convex (AI contributors)

ofy-kibble-capital uses [Convex](https://convex.dev) for classroom financial data: paystubs, accounts, vaults, store POS, attendance-driven payroll, etc. (see planned schema in [`../greenfield_stack_and_architecture.plan.md`](../greenfield_stack_and_architecture.plan.md)).

## Before editing Convex code

1. Read **`convex/_generated/ai/guidelines.md`** first. It overrides generic Convex knowledge from training data.
2. Use **`bunx convex dev`** for local development (via `bun run dev` or directly). Do not use `bunx convex deploy` except for production releases the user explicitly requests.
3. Run **`bun run check`** after substantive Convex or client changes.

## Folder layout

Convex registers **every** `convex/**/*.ts` module in the generated `api`. Only files that export `query` / `mutation` / `action` / `internal*` handlers are callable from the client; helpers are still listed but not invokable.

**Root** (`convex/`) — platform wiring only:

| File                         | Purpose                         |
| ---------------------------- | ------------------------------- |
| `auth.ts`, `auth.config.ts`  | Convex Auth (must stay at root) |
| `convex.config.ts`           | App + component registration    |
| `http.ts`                    | HTTP router (OAuth callbacks)   |
| `schema.ts`                  | Database schema                 |
| `README.md`, `tsconfig.json` | Docs / TS config                |

**`convex/schema/`** — table field maps (`schemaFields.ts`) and shared validators.

**`convex/seed/`** — catalog seed (`index.ts` → `seed/index:seedV1Catalog`), helpers, and seed data.

**`convex/features/`** — product domains. Public handlers live in `features/<name>.ts` (or nested paths); colocated helpers in `features/<name>/`.

| Feature            | Public API module               | Helpers                                                  |
| ------------------ | ------------------------------- | -------------------------------------------------------- |
| Invitations        | `api.features.invitations`      | `features/invitations/policy.ts`, `payToken.ts`          |
| Tenants            | `api.features.tenants`          | `features/tenants/makeTenantsAPI.ts`, `roles.ts`         |
| Roster             | —                               | `features/roster/`                                       |
| Settings           | `api.features.settings`         | `features/settings/`                                     |
| Auth (student app) | `api.features.auth.studentAuth` | `features/auth/redirect.ts`, `studentApp.ts`, `authz.ts` |
| Catalog            | —                               | `features/catalog/siteSlug.ts`                           |
| Organizations      | `api.features.organizations`    | —                                                        |
| Users              | `api.features.users`            | —                                                        |

**Sign-in** stays `api.auth.*` (`convex/auth.ts` at root).

Do not add a catch-all `convex/lib/`.

## Project conventions

- Validate arguments and return types on all public functions.
- Add authentication checks on public mutations/queries once Convex Auth is wired (`getAuthUserId`); see [`auth.md`](auth.md).
- Prefer indexes over `.filter()` for query performance.
- Never use `Date.now()` inside queries (breaks caching/reactivity).
- Schedule **internal** functions only, never `api.*` functions.
- Put Node-only logic in `"use node"` action files; do not define queries/mutations in `features/` helper files unless they export handlers.
- Keep query/mutation wrappers thin; put logic in plain TypeScript helpers.

## Client integration

- `@convex-dev/react-query` with TanStack Query — follow patterns in `src/router.tsx` and routes.
- `VITE_CONVEX_URL` is set for deploys via Netlify + `convex deploy --cmd` (see [`README.md`](../../README.md)).

## Optional tooling

Install Convex agent skills into the repo:

```bash
npx convex ai-files install
```

Project-local skills may also exist under `.agents/skills/` and `.claude/skills/`.

## Environment

Local dev expects a linked Convex project (`.env.local` with `VITE_CONVEX_URL` after `bunx convex dev`). See README **Deploy** and **Requirements**.

## Related docs

- Auth and invitations: [`auth.md`](auth.md)
- Architecture: [`architecture-foundation.md`](architecture-foundation.md)
- Greenfield schema/routes: [`../greenfield_stack_and_architecture.plan.md`](../greenfield_stack_and_architecture.plan.md)
