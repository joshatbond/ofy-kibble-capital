# Convex backend

Classroom financial data for Kibble Capital, PawKet Exchange, and Teacher admin.

## Local development

```bash
bun run dev
```

Runs the TanStack app and `convex dev` together. Requires `.env.local` with `VITE_CONVEX_URL` after linking a deployment.

Typecheck: `bun run typecheck`. See [`docs/ai/convex.md`](../docs/ai/convex.md) and `convex/_generated/ai/guidelines.md` before editing functions.

## Operator catalog seed (Slice 1)

Development deployments need the **Region**, **School site**, and sample **Classroom** rows from [`CONTEXT.md`](../CONTEXT.md).

From the repo root (Convex dev deployment linked):

```bash
bunx convex run seed:seedV1Catalog
```

This is **idempotent**: safe to run again; it skips rows that already exist.

**Creates:**

| Kind | Values |
| ---- | ------ |
| Region | `ofysb` |
| School sites | `ofysb-mv`, `ofysb-sb1`, `ofysb-sb2` |
| Classroom org | `dev-classroom-ofysb-mv` on site `ofysb-mv` (tenants component + `classrooms` link) |

Classroom organizations are **not** teacher self-serve in v1. Teachers join via invitation (Slice 2). Operators may use `organizations.createOrganization` only when `users.canCreateOrganization` is set; routine dev setup uses the internal seed above.
