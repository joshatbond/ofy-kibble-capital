# Slice 3 — Banking shell

## Goal

Append-only ledger and PawKet UI for balances and **Activity history** — no payroll or store yet.

## Dependencies

- Slice 2 (active students have accounts)

## Deliverables

- Schema: `ledgerEntries` (tenant + student + account + type + **Cents**), checking/savings account ids per student
- Queries: checking balance, savings total (unallocated + vault sums later), **Activity history** feed
- PawKet home: balances, transaction list (empty until movements)
- **UI:** functional wireframe using slice-1 design system ([UI build policy](./README.md#ui-build-policy)); Stitch polish in slice 11
- **Sweep to checking** mutation (used later by POS) — unallocated savings only, not **Vault**
- **Offline read-only**: cache last balances/history for display; block writes offline

## Acceptance criteria

- [x] **Student** sees only own **Activity history**; **Teacher** sees all in classroom
- [x] All amounts in **Cents**; display formatted dollars
- [x] No negative balances at layer (mutations reject)

## Domain refs

- **Checking**, **Savings**, **Activity history**, **Money amount**, **Sweep to checking**, **Offline read-only**

## Out of scope

- Vaults, pay split, pay run credits
- PWA push (slice 10)
