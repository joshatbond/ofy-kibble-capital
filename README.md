# ofy-kibble-capital

Student financial literacy ecosystem — Convex backend with [TanStack Start](https://tanstack.com/start) and React.

**Docs:** [`docs/Architecture.md`](docs/Architecture.md) (overview) · [`docs/greenfield_stack_and_architecture.plan.md`](docs/greenfield_stack_and_architecture.plan.md) (product plan) · [`docs/ai/git-workflow.md`](docs/ai/git-workflow.md) (branches & releases) · [`AGENTS.md`](AGENTS.md) (AI contributor index)

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

**Branches & releases:** develop on **`main`**; production deploys only from **`production`** (intentional stub commit/tag). See [`docs/ai/git-workflow.md`](docs/ai/git-workflow.md).

## Requirements

- [Bun](https://bun.sh) 1.2+
- A Convex account (first `bun run dev` will walk through linking a dev deployment)
