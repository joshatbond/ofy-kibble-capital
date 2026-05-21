# Slice 11 — Polish & onboarding

## Goal

Stitch-aligned UI, reliability polish, monthly interest job, and **student guided tours** for first-time success in both PWAs.

## Dependencies

- Feature slices 1–10 functionally complete (tours can stub against stable routes)

## Deliverables

### Visual / UX (Stitch)

- Kibble, PawKet, admin shells per greenfield plan
- Semantic tokens / theme tones (`bun run theme:tones`)
- shadcn primitives + composed screens

### Component catalog (Storybook) — expand

Storybook **bootstrap** is slice 1 ([`01-foundation.md`](./01-foundation.md)); see [UI build policy](./README.md#ui-build-policy). This slice expands the catalog and aligns routes with Stitch — not the first time UI may be styled.

- [ ] Stories for feature-composed UI built in slices 2–10 (paystub rows, vault wizard, POS cart, admin roster) where not already added
- [ ] Reconcile wireframe routes from 2–10 with Stitch templates (layout/visual debt)
- [ ] Optional: CI visual-regression on a small golden story set

### Student guided tour (required)

Product-led **guided tour** (step overlay or coach marks — pick library e.g. driver.js, react-joyride, or custom) — **separate tour per installed PWA**, no cross-app links (v1).

#### PawKet Exchange (primary)

Suggested steps after first accept + accounts exist:

1. Welcome — simulated bank, **Currency label**
2. **Checking** vs **Savings** vs **Vaults**
3. **Activity history**
4. Optional: create first **Vault** (**Vault setup**) or defer to “Explore”
5. **Peer transfer** (if slice 9 shipped) — pick reason, no balances shown
6. How **Student store** / **POS** works (teacher scans your ID)
7. Enable push — **Paycheck notification** / purchase alerts

Persist `pawketTourCompletedAt` (or per-step flags) on student profile.

#### Kibble Capital (secondary)

Run after or before pay split wizard (wizard is blocking; tour can follow):

1. Purpose — paystubs, taxes, **Pay split**
2. Complete **Pay split** if not done (or point to wizard)
3. **PTO request** + where approvals show up
4. View **Posted paystub** / **In-app badge** behavior
5. **PTO decision notification** permission on Kibble if push used

Persist `kibbleTourCompletedAt`.

#### Tour rules

- [ ] Skippable; replay from settings (“Take tour again”)
- [ ] Do not show on **Teacher** or **Pending invitation** sessions
- [ ] Respect reduced motion preference
- [ ] No tour on SSR marketing landings (signed-in routes only)

### Other polish

- **Offline read-only** UX indicators (“offline — showing saved data”)
- Monthly **Interest accrual** job (if not shipped in slice 6): 1st, **Average daily balance**, ADR-0003
- Performance pass on Convex subscriptions (classroom size ~30)
- Accessibility: touch targets, focus order on POS and tours

## Acceptance criteria

- [ ] New student can complete PawKet tour without dead-ends on empty state
- [ ] Pay split wizard still blocks other Kibble features until done
- [ ] Tours do not reference the other app’s URL (separate installs)
- [ ] Replay clears and restarts steps

## Domain refs

- **Kibble Capital**, **PawKet Exchange**, **Offline read-only**, **Interest accrual**, **Pay split**, **Vault setup**

## Out of scope

- Teacher-admin guided tour (optional backlog)
- Charts (v1 none)
- In-app cross-links between apps
