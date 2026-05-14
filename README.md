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

Vercel production builds use `bun run build` inside `bunx convex deploy` (see [`vercel.json`](vercel.json)).

## Requirements

- [Bun](https://bun.sh) 1.2+
- A Convex account (first `bun run dev` will walk through linking a dev deployment)
