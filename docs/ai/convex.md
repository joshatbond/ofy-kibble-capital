# Convex (AI contributors)

ofy-kibble-capital uses [Convex](https://convex.dev) for classroom financial data: paystubs, accounts, vaults, store POS, attendance-driven payroll, etc. (see planned schema in [`../greenfield_stack_and_architecture.plan.md`](../greenfield_stack_and_architecture.plan.md)).

## Before editing Convex code

1. Read **`convex/_generated/ai/guidelines.md`** first. It overrides generic Convex knowledge from training data.
2. Use **`bunx convex dev`** for local development (via `bun run dev` or directly). Do not use `bunx convex deploy` except for production releases the user explicitly requests.
3. Run **`bun run check`** after substantive Convex or client changes.

## Project conventions

- Validate arguments and return types on all public functions.
- Add authentication checks on public mutations/queries once Convex Auth is wired (`getAuthUserId`); see [`auth.md`](auth.md).
- Prefer indexes over `.filter()` for query performance.
- Never use `Date.now()` inside queries (breaks caching/reactivity).
- Schedule **internal** functions only, never `api.*` functions.
- Put Node-only logic in `"use node"` action files; do not define queries/mutations there.
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
