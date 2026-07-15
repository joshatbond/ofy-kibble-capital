# Convex backend

Classroom financial data for Kibble Capital, PawKet Change, and Teacher admin.

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
bunx convex run seed/index:seedV1Catalog
```

This is **idempotent**: safe to run again; it skips rows that already exist.

**Creates:**

| Kind | Values |
| ---- | ------ |
| Region | `ofysb` |
| School sites | `ofysb-mv`, `ofysb-sb1`, `ofysb-sb2` |
| Classroom org | `dev-classroom-ofysb-mv` on site `ofysb-mv` (tenants component + `classrooms` link) |

Classroom organizations are **not** teacher self-serve in v1. Teachers join via invitation (Slice 2). Operators may use `organizations.createOrganization` only when `users.canCreateOrganization` is set; routine dev setup uses the internal seed above.

The seed also writes **settings stack** defaults (`regionSettings`, `schoolSiteSettings`) and a **classSettings** snapshot for the dev classroom.

### Link your Google account to the dev classroom

**Region / school site rows are catalog only** — they do not grant admin access. Teacher admin checks **classroom org membership** in the tenants component (`owner`, `admin`, or `teacher` on `dev-classroom-ofysb-mv`), plus a matching authz role.

1. Run the catalog seed (above).
2. Sign in once at `/admin/landing` with your `@ofy.org` Google account (creates your `users` row).
3. Link yourself to the dev classroom:

```bash
bunx convex run seed/index:linkDevTeacherByEmail '{"email":"you@ofy.org"}'
```

Optional role (default `owner`): `"role":"teacher"`.

**Manual dashboard path** (if you prefer): after step 2, note your `users._id` and the dev classroom’s `organizationId` from the `classrooms` row (`orgSlug` `dev-classroom-ofysb-mv`). In the Convex dashboard, add **both**:

- **tenants** component → `members` — `userId` = your user id, `organizationId` = dev org id, `role` = `owner` (or `admin` / `teacher`)
- **authz** component — role assignment for the same user, org scope, and role (the CLI helper above does both)

Do **not** expect a row in `regions` alone to unlock `/admin/`.

### Dev: password test accounts (local only)

When the Convex **Development** deployment has `SITE_URL=http://localhost:3000`, password sign-in is enabled alongside Google OAuth. Use it on `/invite/:id` to accept invites for alias or personal test emails without Workspace Google sign-in.

1. Teacher invites the test address (e.g. `you+student1@ofy.org`) from the classroom roster, or use any email on `/kibble/landing` or `/pawket/landing`.
2. Open the invite link locally.
3. Enter any password (4+ characters). The account is created on first sign-in if needed.
4. Accept redirects to Kibble or admin as usual.

Production deployments register Google OAuth only. Opt in elsewhere with `DEV_PASSWORD_AUTH=true` on the Convex deployment.

### Effective settings (dev)

After seeding, inspect merged settings for the dev classroom org (use the `organizationId` from seed output):

```bash
bunx convex run settings:effectiveSettingsForOrganizationInternal '{"organizationId":"<org id>"}'
```

Or call `settings:effectiveSettingsForOrganization` from the Convex dashboard / client.
