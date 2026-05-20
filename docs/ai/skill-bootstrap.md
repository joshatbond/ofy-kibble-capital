# AI Skill Bootstrap Guide

This repo uses a thin [`AGENTS.md`](../../AGENTS.md) plus detailed docs in `docs/ai/`.

## Preferred skill coverage

- TanStack Start / TanStack Router — [`tanstack-intent-skills.md`](tanstack-intent-skills.md)
- Bun
- TypeScript + React — [`react.md`](react.md)
- Convex + Convex Auth (planned; [`auth.md`](auth.md))
- Tailwind CSS v4 + shadcn (planned)
- Netlify deploy for TanStack Start
- Google Stitch (design handoff; see greenfield plan)

## Bootstrap order

1. Read [`README.md`](../../README.md) and [`../Architecture.md`](../Architecture.md) for repo basics.
2. For branches/releases: [`git-workflow.md`](git-workflow.md) — **`main` is dev only**; never push `production` unless the user asks to ship.
3. Read [`AGENTS.md`](../../AGENTS.md) for pointers only.
4. Follow [`architecture-foundation.md`](architecture-foundation.md) for constraints.
5. For product scope and routes, read [`../greenfield_stack_and_architecture.plan.md`](../greenfield_stack_and_architecture.plan.md).
6. For React UI in routes or components, read [`react.md`](react.md).
7. For TanStack Start/Router work, load skills from [`tanstack-intent-skills.md`](tanstack-intent-skills.md).
8. For Convex work, read [`convex.md`](convex.md) then `convex/_generated/ai/guidelines.md`.
9. For auth or invitations, read [`auth.md`](auth.md) and ms-engage-v2 `convex/` before implementing.
10. Use Cursor/Claude Convex plugin rules and `.agents/skills/convex*` when present.

## Drift prevention

When architecture decisions change:

- Update [`architecture-foundation.md`](architecture-foundation.md) first.
- Keep [`AGENTS.md`](../../AGENTS.md) index aligned in the same change.
- Update [`../Architecture.md`](../Architecture.md) if the human-facing summary should change.
