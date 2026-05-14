# ofy-kibble-capital

Student financial literacy ecosystem — Convex backend with [TanStack Start](https://tanstack.com/start) and React.

## Package manager

This repository uses **[Bun](https://bun.sh)** for installs and scripts. Do not commit `package-lock.json`; use `bun.lock` only.

```bash
bun install
bun run dev
```

Convex CLI (same as `npx convex`, resolved via Bun):

```bash
bunx convex dev
bunx convex deploy
```

## Deploy (Netlify)

Production builds run **Convex deploy** and the **Vite** app in one step (see [`netlify.toml`](netlify.toml)), matching [Netlify’s TanStack Start guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/).

1. In the [Convex dashboard](https://dashboard.convex.dev), create a **Deploy key** for your production deployment.
2. In Netlify: **Site configuration → Environment variables**, add **`CONVEX_DEPLOY_KEY`** (build secret). The build command runs `convex deploy --cmd 'bun run build'`, which wires **`VITE_CONVEX_URL`** for that deploy automatically.
3. Connect the Git repo and deploy, or run `bun run netlify deploy` locally after `bun run netlify login`.

Netlify picks **Bun** automatically when [`bun.lock`](bun.lock) is present.

## Branches and production releases

- **`main`** — day-to-day integration; treat as the dev line (merge PRs here, break things if needed).
- **`production`** — what **Netlify’s production deploy** should track. Only changes you deliberately promote land here, usually as cherry-picks plus a **release / version-bump** commit.

### Netlify

1. **Site configuration → Build & deploy → Continuous deployment → Production branch** → set to **`production`** (not `main`).
2. Optional: enable **Deploy previews** for pull requests or for **`main`** so you get preview URLs without updating production.

### Promoting work from `main` to `production`

After commits on `main` are ready to ship:

```bash
git fetch origin
git checkout production
git pull origin production

# Bring over only the commits you want (repeat or use a range as appropriate)
git cherry-pick <sha1>
git cherry-pick <sha2>

# Optional: bump app version for traceability (add a "version" field in package.json if you use one)
# Then commit the bump (or combine with last cherry-pick via --amend)
git add package.json   # and any other release metadata
git commit -m "chore(release): v0.2.0"

git push origin production
```

Resolve cherry-pick conflicts as usual (`git status`, fix, `git cherry-pick --continue` or `--abort`).

### First-time `production` branch

When `main` is in a good state to become the first production baseline:

```bash
git checkout main
git pull origin main
git checkout -b production
git push -u origin production
```

Then point Netlify’s **production branch** at **`production`** as above.

## Requirements

- [Bun](https://bun.sh) 1.2+
- A Convex account (first `bun run dev` will walk through linking a dev deployment)
