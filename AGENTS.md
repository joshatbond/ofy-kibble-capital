# ofy-kibble-capital — Agent Guidelines

Tool-agnostic entry point for AI contributors (Cursor, Codex, Claude Code, etc.). **Keep this file thin** — detailed rules live under `docs/`.

## Project intent

Student financial literacy ecosystem: **Kibble Capital** (accounting-style PWA), **PawKet Change** (banking-style PWA), and **teacher admin** — one TanStack Start app, one Convex backend. See [`docs/Architecture.md`](docs/Architecture.md) and the greenfield plan [`docs/greenfield_stack_and_architecture.plan.md`](docs/greenfield_stack_and_architecture.plan.md).

## Collaboration rules

- Follow [`docs/ai/architecture-foundation.md`](docs/ai/architecture-foundation.md) for stack, layering, SSR scope, and coding constraints.
- Follow [`docs/ai/convex.md`](docs/ai/convex.md) when changing `convex/` or Convex client integration.
- Follow [`docs/ai/auth.md`](docs/ai/auth.md) for authentication, invitations, tenants, and RBAC (planned).
- Follow [`docs/ai/react.md`](docs/ai/react.md) for React components: smallest units, colocation, state pushed to the lowest node.
- Prefer typed APIs; avoid `any` unless documented.
- Prefer small, reversible changes over broad rewrites.
- Use semantic commits — [`docs/ai/commit-conventions.md`](docs/ai/commit-conventions.md).
- Never add tool attribution to commit messages (`Made with: Cursor`, `Co-Authored-By: <tool>`, etc.).
- Do not `git commit` or `git push` unless the user explicitly asks.
- **`main` is development only** — never treat it as production; see [`docs/ai/git-workflow.md`](docs/ai/git-workflow.md) before pushing to `production` or tagging a release.

## Source of truth (when docs overlap)

1. [`docs/ai/architecture-foundation.md`](docs/ai/architecture-foundation.md) — canonical architecture.
2. This file — short index only; update pointers when topics move.
3. [`docs/Architecture.md`](docs/Architecture.md) — human-facing summary (must not drift from canonical rules).

<!-- convex-ai-start -->

When working on Convex code, **always read
[`docs/ai/convex.md`](docs/ai/convex.md) and
`convex/_generated/ai/guidelines.md`** first. Install skills with
`npx convex ai-files install` if needed.

<!-- convex-ai-end -->

## Topic index

| Topic                      | Doc                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| Architecture & conventions | [`docs/ai/architecture-foundation.md`](docs/ai/architecture-foundation.md)                         |
| Product & route plan       | [`docs/greenfield_stack_and_architecture.plan.md`](docs/greenfield_stack_and_architecture.plan.md) |
| Convex backend             | [`docs/ai/convex.md`](docs/ai/convex.md) → `convex/_generated/ai/guidelines.md`                    |
| Auth, invites, tenants     | [`docs/ai/auth.md`](docs/ai/auth.md)                                                               |
| React UI                   | [`docs/ai/react.md`](docs/ai/react.md)                                                             |
| Commits                    | [`docs/ai/commit-conventions.md`](docs/ai/commit-conventions.md)                                   |
| TanStack Intent skills     | [`docs/ai/tanstack-intent-skills.md`](docs/ai/tanstack-intent-skills.md)                           |
| Skill bootstrap order      | [`docs/ai/skill-bootstrap.md`](docs/ai/skill-bootstrap.md)                                         |
| Git branches & releases    | [`docs/ai/git-workflow.md`](docs/ai/git-workflow.md)                                               |
| Domain glossary            | [`CONTEXT.md`](CONTEXT.md)                                                                         |
| ADRs                       | [`docs/adr/`](docs/adr/)                                                                           |
| Scoped work slices         | [`docs/scope/`](docs/scope/)                                                                       |
