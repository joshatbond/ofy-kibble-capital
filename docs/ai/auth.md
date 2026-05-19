# Auth (AI contributors)

**Planned:** [Convex Auth](https://docs.convex.dev/auth/convex-auth) (`@convex-dev/auth`) with **invitation-only** onboarding — no public sign-up. Multi-tenant classrooms via `@djpanda/convex-tenants` and RBAC via `@djpanda/convex-authz` (see greenfield plan).

Do **not** use Clerk unless the project explicitly switches auth providers.

## Reference implementation

Mirror patterns from **ms-engage-v2** `convex/` (Options for Youth engagement app): invitation links, `getAuthUserId`, tenant membership, and `authz.require` — not a copy of every org feature; use the smallest model that enforces invite-only access.

Before inventing a new auth or invitation flow, study that reference tree.

## Reference stack (ms-engage-v2)

| Piece                 | Typical location                           | Role                                           |
| --------------------- | ------------------------------------------ | ---------------------------------------------- |
| Convex Auth setup     | `convex/auth.ts`                           | `convexAuth({ providers, callbacks })`         |
| Auth config           | `convex/auth.config.ts`                    | JWT provider for `CONVEX_SITE_URL`             |
| HTTP routes           | `convex/http.ts`                           | `auth.addHttpRoutes(http)`                     |
| Schema                | `convex/schema.ts`                         | `...authTables` from `@convex-dev/auth/server` |
| Identity in functions | `getAuthUserId(ctx)`                       | Never accept `userId` from the client for auth |
| Invitations           | `convex/invitations.ts` + tenants API      | Invite by email; share `/invite/:id` link      |
| Authorization         | `convex/authz.ts`                          | `@djpanda/convex-authz` + tenant scopes        |
| Tenants component     | `convex/convex.config.ts`                  | `@djpanda/convex-tenants`                      |
| Client accept flow    | e.g. `src/routes/invite.$invitationId.tsx` | Pending invite → sign in → accept              |

## Patterns to reuse

1. **Convex Auth** — OAuth providers via `convexAuth`; client `ConvexAuthProvider` in the TanStack Start root.
2. **Invite-only membership** — Teachers/admins invite by email; invitees sign in with the **same email** and accept. No open registration.
3. **Server-side identity** — Protected functions use `getAuthUserId(ctx)`; link domain rows via stable auth id / `tokenIdentifier` from `ctx.auth.getUserIdentity()` (see `convex/_generated/ai/guidelines.md`).
4. **Authorization** — Teacher vs student roles per tenant; use `authz.require` (or equivalent) for admin and cross-user actions.

Do **not** port ms-engage’s domain-specific `afterUserCreatedOrUpdated` allowlist callbacks unless product requires them — Kibble access is **invitation-based**.

## Product-specific notes

- **Teacher admin** creates/manages classroom tenants and invitations.
- **Students** access Kibble and/or PawKet only within their tenant after accept.
- Store POS and payroll mutations must enforce teacher role (or finer scopes) server-side.

## Setup checklist (when implementing)

- [x] `npx @convex-dev/auth` — `convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`
- [x] `authTables` in `convex/schema.ts`
- [x] Google OAuth in `convex/auth.ts` (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` on deployment)
- [x] `ConvexAuthProvider` in `src/router.tsx`
- [x] Post-OAuth redirect: `signIn('google', { redirectTo: '/kibble' | '/pawket' })` + `callbacks.redirect` in `convex/auth.ts` / `convex/lib/authRedirect.ts`
- [ ] Register tenants + authz components in `convex/convex.config.ts`
- [ ] Invitation mutations/queries and `/invite/$invitationId` (or equivalent)
- [ ] `getAuthUserId` (and authz) on all public functions that touch user or classroom data

### Dual-surface redirect

Marketing sign-in uses `StudentSignInButton` with `app="kibble"` or `app="pawket"`. Public landings live at `/kibble/landing` and `/pawket/landing`; protected app homes are `/kibble` and `/pawket`. OAuth `redirectTo` keeps users on the surface they signed in from.

## Related docs

- [`convex.md`](convex.md) — general Convex rules
- [`../greenfield_stack_and_architecture.plan.md`](../greenfield_stack_and_architecture.plan.md) — auth todos and stack
- `convex/_generated/ai/guidelines.md` — generated API and identity rules
