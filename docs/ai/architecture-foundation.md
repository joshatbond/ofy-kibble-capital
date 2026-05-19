# Architecture Foundation

Baseline architecture and contributor constraints for **ofy-kibble-capital**.

## Stack baseline

- App framework: TanStack Start (React 19, file-based routes, Vite 8)
- Package manager: Bun (`bun install`; commit `bun.lock`, not `package-lock.json`)
- Language/UI: TypeScript + React + Tailwind CSS v4
- Backend: Convex (`@convex-dev/react-query` on the client)
- Deploy: Netlify — `@netlify/vite-plugin-tanstack-start` loaded only on `vite build` (dynamic import in `vite.config.ts`)
- Auth (planned): Convex Auth + `@djpanda/convex-tenants` + `@djpanda/convex-authz`, invitation-only — see [`auth.md`](auth.md)
- Design (planned): shadcn (Base UI), PRD tokens, Google Stitch → shared `src/components/ui/`

## Layering (target)

1. **Routes** — `src/routes/` file routes; layouts per surface (`/kibble`, `/pawket`, `/admin`).
2. **UI** — Shared primitives (`src/components/ui/`), surface-specific shells (`src/components/kibble/`, etc.).
3. **Data** — Convex hooks/queries from route and feature modules; no business logic in generated files.
4. **Convex** — Schema, auth, tenants, domain functions under `convex/`.

Keep route components thin; put reusable logic in typed helpers or Convex functions. React UI: [`react.md`](react.md) (smallest components, colocation, low state).

## SSR and client-only code

- **SSR only** for the two student **marketing landing** routes (Kibble and PawKet) once implemented.
- **Client-first** for signed-in apps, Convex Auth, dashboards, admin, and store POS.
- Do not import browser-only or auth-session code from root layouts that must SSR marketing pages unless split by route.

## Vite / Netlify

- `vite.config.ts` uses a **dynamic import** for the Netlify plugin so `vite dev` does not load Netlify’s dependency tree.
- `package.json` may include `overrides` for transitive deps (e.g. `brace-expansion`) when the lockfile hoists incompatible versions.

## Dev workflow

- Full stack: `bun run dev` (`scripts/dev.ts` — Convex, optional Stitch MCP proxy, Vite on port 3000)
- Convex CLI: `bunx convex dev` / `bunx convex deploy`
- Quality gate: `bun run check` (Prettier + ESLint with fix)
- Production build: `bun run build` (`vite build` + `tsc --noEmit`)
- Git: develop on **`main`**; ship only via intentional updates to **`production`** — [`git-workflow.md`](git-workflow.md)

## Coding constraints

- Prefer strongly typed APIs; use Convex-generated types for documents.
- Path alias: `~/*` → `src/*` (see `tsconfig.json`).
- Import order and some style rules are enforced by ESLint (`eslint.config.js`), not Prettier — run `bun run format` after edits.
- Keep modules focused; avoid drive-by refactors.
- Run `bun run check` before finalizing substantive changes.

## Dependency policy

- Prefer maintained packages aligned with the stack above.
- Keep dependencies minimal and scoped to a clear use-case.
- Document non-obvious new dependencies in the PR or commit body.

## Commit message policy

Semantic commits — see [`commit-conventions.md`](commit-conventions.md).

## AI contributor checklist

Before finalizing a change:

- Confirm rules in this doc still hold.
- Keep [`AGENTS.md`](../../AGENTS.md) pointers accurate if you add or move topics.
- For `convex/` changes, read [`convex.md`](convex.md) and `convex/_generated/ai/guidelines.md`.
- For auth or invitations, read [`auth.md`](auth.md) and the ms-engage-v2 Convex reference before inventing flows.
- Prefer small, reviewable increments.
- Do not `git commit` or `git push` unless the user explicitly requests it.

## Related docs

- Product plan: [`../greenfield_stack_and_architecture.plan.md`](../greenfield_stack_and_architecture.plan.md)
- Human summary: [`../Architecture.md`](../Architecture.md)
- TanStack Intent skills: [`tanstack-intent-skills.md`](tanstack-intent-skills.md)
- Convex: [`convex.md`](convex.md)
- Auth: [`auth.md`](auth.md)
- React: [`react.md`](react.md)
