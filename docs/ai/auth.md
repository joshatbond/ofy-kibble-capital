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

- **Google Workspace** — OAuth client is **Internal**; only `@ofy.org` accounts complete Google sign-in. **Accept** enforces invitee email match only (domain is implied by OAuth). **`assertOfyOrgEmail`** runs on invite create (`invitations.ts`, `tenants.validateInvitationCreate`) so teachers cannot invite off-domain addresses.
- **Teacher admin** creates/manages classroom tenants and invitations.
- **Students** access Kibble and/or PawKet only within their tenant after accept.
- Store POS and payroll mutations must enforce teacher role (or finer scopes) server-side.

## Setup checklist (when implementing)

- [x] `npx @convex-dev/auth` — `convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`
- [x] `authTables` in `convex/schema.ts`
- [x] Google OAuth in `convex/auth.ts` (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` on deployment)
- [x] `ConvexAuthProvider` in `src/router.tsx`
- [x] Post-OAuth redirect: `signIn('google', { redirectTo: '/kibble' | '/pawket' })` + `callbacks.redirect` in `convex/auth.ts` / `convex/features/auth/redirect.ts`
- [x] Register tenants + authz components in `convex/convex.config.ts`
- [x] Invitation mutations/queries and `/invite/$invitationId` (see `convex/invitations.ts`, `src/routes/invite/`)
- [ ] `getAuthUserId` (and authz) on all public functions that touch user or classroom data

### Dual-surface redirect

Marketing sign-in uses `StudentSignInButton` with `app="kibble"` or `app="pawket"`. Public landings live at `/kibble/landing` and `/pawket/landing`; protected app homes are `/kibble` and `/pawket`. OAuth `redirectTo` keeps users on the surface they signed in from.

### Multi-host redirects (local / Netlify / production)

Post-OAuth URLs are built in `convex/features/auth/redirect.ts`. The client sends an **absolute** `redirectTo` (`window.location.origin` + path). The server keeps that origin only if it is allowlisted on that Convex deployment.

This project uses **two Convex deployments** (Development + Production), not three. Map frontends like this:

| Frontend                                   | Convex deployment | Netlify / local                              |
| ------------------------------------------ | ----------------- | -------------------------------------------- |
| `http://localhost:3000`                    | **Development**   | `bun run dev` → `.env.local`                 |
| `https://main--kibble-capital.netlify.app` | **Development**   | Branch deploy key on `main`                  |
| `https://bark.ofys.org`                    | **Production**    | Production deploy key on `production` branch |

**Development** environment variables (Convex dashboard → your project → **Development** → Settings → Environment variables):

| Variable             | Value                                      |
| -------------------- | ------------------------------------------ |
| `SITE_URL`           | `http://localhost:3000`                    |
| `ALLOWED_SITE_URLS`  | `https://main--kibble-capital.netlify.app` |
| `AUTH_GOOGLE_ID`     | (same OAuth client as prod)                |
| `AUTH_GOOGLE_SECRET` | (same OAuth client as prod)                |

**Production** environment variables (**Production** tab, not Development):

| Variable             | Value                   |
| -------------------- | ----------------------- |
| `SITE_URL`           | `https://bark.ofys.org` |
| `AUTH_GOOGLE_ID`     |                         |
| `AUTH_GOOGLE_SECRET` |                         |

Do **not** set `ALLOWED_SITE_URLS` on Production unless you add more hosts later.

After changing env vars, run `bunx convex deploy` (production) or let the next Netlify/`convex dev` push pick up Development.

**Google Cloud Console** (OAuth client):

- **Authorized JavaScript origins:** all three app URLs above.
- **Authorized redirect URIs:** both Convex callback URLs (not the Netlify URL):
  - `https://<your-dev-deployment>.convex.site/api/auth/callback/google`
  - `https://<your-prod-deployment>.convex.site/api/auth/callback/google`

Find the exact host under Convex dashboard → each deployment → Settings (HTTP Actions URL / deployment URL ends in `.convex.site`).

## Related docs

- [`convex.md`](convex.md) — general Convex rules
- [`../greenfield_stack_and_architecture.plan.md`](../greenfield_stack_and_architecture.plan.md) — auth todos and stack
- `convex/_generated/ai/guidelines.md` — generated API and identity rules
