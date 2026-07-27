# Scoped work documents

Iteration plan for **ofy-kibble-capital**, derived from the grill session ([`CONTEXT.md`](../../CONTEXT.md), [`docs/adr/`](../adr/), and [`docs/greenfield_stack_and_architecture.plan.md`](../greenfield_stack_and_architecture.plan.md)).

## Build order

| #   | Slice                       | Doc                                                                      |
| --- | --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1   | Foundation                  | [01-foundation.md](./01-foundation.md)                                   |
| 2   | Roster & invites            | [02-roster-and-invites.md](./02-roster-and-invites.md)                   |
| 3   | Banking shell               | [03-banking-shell.md](./03-banking-shell.md)                             | **Done** — ledger, balances, activity, sweep, offline read-only, teacher feed |
| 4   | Vaults & pay split          | [04-vaults-and-pay-split.md](./04-vaults-and-pay-split.md)               |
| 5   | Payroll engine              | [05-payroll-engine.md](./05-payroll-engine.md)                           |
| 6   | ms-engage attendance import | [06-ms-engage-attendance-import.md](./06-ms-engage-attendance-import.md) |
| 7   | PTO                         | [07-pto.md](./07-pto.md)                                                 |
| 8   | POS & catalog               | [08-pos-and-catalog.md](./08-pos-and-catalog.md)                         |
| 9   | Peer transfer               | [09-peer-transfer.md](./09-peer-transfer.md)                             |
| 10  | Notifications               | [10-notifications.md](./10-notifications.md)                             |
| 11  | Polish & onboarding         | [11-polish-and-onboarding.md](./11-polish-and-onboarding.md)             |

## Cross-cutting rules

- **Money:** integer cents; half-up rounding per line ([`CONTEXT.md`](../../CONTEXT.md) — **Money amount**).
- **Tenancy:** one **Organization** = **Classroom**; **Site slug** on seed ([`0002`](../adr/0002-ms-engage-turso-attendance-import.md) does not apply to tenancy).
- **Auth:** Google `@ofy.org` only; invitation-only ([`02-roster-and-invites.md`](./02-roster-and-invites.md)).
- **v1 operator model:** seeded classrooms; single-classroom **Teacher admin** (no switcher).
- **UI build policy** and **Storybook:** see [below](#ui-build-policy). Domain/money logic uses unit tests ([`CONTEXT.md`](../../CONTEXT.md) — **Testing**).

## UI build policy

Slices disagree on _backend_ work, not on whether feature screens get real CSS. Use this split so Storybook timing and slice 11 polish stay coherent.

| Phase                     | Slices             | UI expectation                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Design system**         | **1** (foundation) | Tailwind v4, semantic tokens (`bun run theme:tones`), shadcn primitives, `AppTheme` per app, SSR marketing landings, branded loaders, **Storybook** bootstrap + stories for primitives/loaders. Greenfield scaffold may already include part of this — slice 1 finishes and documents it.                                                                                       |
| **Functional feature UI** | **2–10**           | Real routes, data, and interactions. Compose from `src/components/ui/`, surface shells, and tokens. **Readable wireframe fidelity** — lists, forms, balances, empty states; correct **Cents** display. **Not** Stitch pixel-polish, marketing-quality layout passes, guided tours, or bespoke illustration work. New reusable components get Storybook stories when introduced. |
| **Polish**                | **11**             | Stitch-aligned screens, accessibility/touch pass, student **Guided tour**, optional visual-regression on golden stories. Revisit feature routes for layout/visual debt from 2–10.                                                                                                                                                                                               |

**Slices 2–10 are not “unstyled.”** They use the design system from slice 1. They **defer polish** (final hierarchy, spacing rhythm, Stitch templates, motion, tours) to slice 11.

**Slices 2–10 are not “layout-free.”** They need enough structure to use and test flows (e.g. PawKet balance + **Activity history** in slice 3). They must not block on perfect visuals.

**Storybook:** Required by end of **slice 1**, before **slice 3**. Expand stories as components land in 2–10; slice 11 adds feature-composed stories and optional CI snapshots.

**Anti-patterns:**

- Building slice 3+ feature UI with ad-hoc CSS outside tokens/primitives while waiting for slice 11
- Spending slice 3–10 time on Stitch-perfect paystub/POS layouts (belongs in 11)
- Bootstrapping Storybook only in slice 11 while styling landings/loaders in slice 1 without a catalog

## Deferred (called out in slices)

- Site-wide **Settings propagation** and **Transfer reason** site seeds
- Multi-classroom teacher switcher
- **Audit retention** purge job
- Charts / analytics
- In-app cross-links between Kibble and PawKet (separate installs)
