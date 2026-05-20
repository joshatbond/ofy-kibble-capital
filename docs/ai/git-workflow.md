# Git workflow (AI contributors)

## Branch roles

| Branch           | Role                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| **`main`**       | **Primary development branch.** Default for day-to-day work, PRs, and integration. Safe to break; not production. |
| **`production`** | **Production deploy branch only.** Netlify’s **Production branch** must be `production`, **never `main`**.        |

**`main` is not a production branch.** Do not configure Netlify (or Convex prod deploy keys on production context) so that every push to `main` updates the live production site.

## What agents should do

- Target **`main`** for normal commits and PRs unless the user specifies another branch.
- **Do not** push to `production`, create release tags, or run production Convex deploy unless the user **explicitly** asks to ship.
- **Do not** suggest merging `main` → `production` as part of routine feature work.
- When the user asks to release, follow [Promoting to production](#promoting-to-production) below.

## Netlify mapping

1. **Production branch** → `production` (required, never `main`).
2. **Branch deploys** → include `main` for a stable **dev/staging URL** (e.g. `https://main--<site>.netlify.app`), separate from production:
   - **Site configuration → Build & deploy → Continuous deployment → Branches and deploy contexts**
   - Under **Branch deploys**, enable **`main`** ([branch deploy docs](https://docs.netlify.com/build/configure-builds/overview/#git-workflow-for-branch-deploy-controls))
3. **Convex env scopes:** **Production** context → prod `CONVEX_DEPLOY_KEY`; **Branch deploys** / **Deploy previews** → dev deploy key. [Environment scopes](https://docs.netlify.com/build/environment-variables/overview/#scopes). Initial site setup: [`README.md`](../../README.md#deploy-netlify).

## Promoting to production

Production releases must be **intentional**: updating `production` is a deliberate act, not a side effect of merging to `main`.

### Preferred: release marker on `production`

After `main` is in a state you want to ship:

```bash
git fetch origin
git checkout production
git pull origin production

# Ship the exact snapshot from main (fast-forward when possible)
git merge --ff-only origin/main
# If production has diverged, use cherry-picks for specific SHAs instead (below).

# Intentional release marker (empty commit documents "we shipped now")
git commit --allow-empty -m "chore(release): v0.2.0"

# Optional but recommended: annotated tag for the release
git tag -a v0.2.0 -m "Production release v0.2.0"

git push origin production
git push origin v0.2.0   # if tagged
```

The **stub (empty) commit** and/or **tag** on `production` makes the production deploy auditable in git history even when the tree matches `main`.

### Cherry-pick selective changes

When production should **not** take all of `main`, cherry-pick specific commits onto `production`, then add the same **stub release commit** and tag before pushing:

```bash
git cherry-pick <sha1>
git cherry-pick <sha2>
git commit --allow-empty -m "chore(release): v0.2.0"
git push origin production
```

Resolve conflicts with `git cherry-pick --continue` or `--abort` as usual.

### Version traceability

Optionally bump `version` in `package.json` in the release commit (or in the stub commit message body) so production builds are easy to correlate.

## First-time `production` branch

```bash
git checkout main
git pull origin main
git checkout -b production
git push -u origin production
```

Then set Netlify **Production branch** to `production`.

## Related docs

- Netlify + Convex env setup: [`README.md`](../../README.md)
- Commit format for releases: [`commit-conventions.md`](commit-conventions.md) (`chore(release): …`)
