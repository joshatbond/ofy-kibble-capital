# Scoped work documents

Iteration plan for **ofy-kibble-capital**, derived from the grill session ([`CONTEXT.md`](../../CONTEXT.md), [`docs/adr/`](../adr/), and [`docs/greenfield_stack_and_architecture.plan.md`](../greenfield_stack_and_architecture.plan.md)).

## Build order

| # | Slice | Doc |
|---|--------|-----|
| 1 | Foundation | [01-foundation.md](./01-foundation.md) |
| 2 | Roster & invites | [02-roster-and-invites.md](./02-roster-and-invites.md) |
| 3 | Banking shell | [03-banking-shell.md](./03-banking-shell.md) |
| 4 | Vaults & pay split | [04-vaults-and-pay-split.md](./04-vaults-and-pay-split.md) |
| 5 | ms-engage attendance import | [05-ms-engage-attendance-import.md](./05-ms-engage-attendance-import.md) |
| 6 | Payroll engine | [06-payroll-engine.md](./06-payroll-engine.md) |
| 7 | PTO | [07-pto.md](./07-pto.md) |
| 8 | POS & catalog | [08-pos-and-catalog.md](./08-pos-and-catalog.md) |
| 9 | Peer transfer | [09-peer-transfer.md](./09-peer-transfer.md) |
| 10 | Notifications | [10-notifications.md](./10-notifications.md) |
| 11 | Polish & onboarding | [11-polish-and-onboarding.md](./11-polish-and-onboarding.md) |

## Cross-cutting rules

- **Money:** integer cents; half-up rounding per line ([`CONTEXT.md`](../../CONTEXT.md) — **Money amount**).
- **Tenancy:** one **Organization** = **Classroom**; **Site slug** on seed ([`0002`](../adr/0002-ms-engage-turso-attendance-import.md) does not apply to tenancy).
- **Auth:** Google `@ofy.org` only; invitation-only ([`02-roster-and-invites.md`](./02-roster-and-invites.md)).
- **v1 operator model:** seeded classrooms; single-classroom **Teacher admin** (no switcher).

## Deferred (called out in slices)

- Site-wide **Settings propagation** and **Transfer reason** site seeds
- Multi-classroom teacher switcher
- **Audit retention** purge job
- Charts / analytics
- In-app cross-links between Kibble and PawKet (separate installs)
