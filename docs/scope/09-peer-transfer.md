# Slice 9 — Peer transfer

## Goal

Zelle-style **Peer transfer** within a classroom with preset **Transfer reason** labels.

## Dependencies

- Slice 3 (ledger transfers)
- Slice 10 (recipient PWA notification)
- Slice 1 (**Settings stack** for reason list — seed deferred)

## Deliverables

- **Transfer reason** list: product defaults in v1; **Settings stack** site overrides deferred (document in seed backlog)
- Student: pick recipient (names only, no balances), amount, reason
- Enforce same **Organization**; balance check only (no daily cap)
- Recipient **PWA notification** on PawKet

## Acceptance criteria

- [ ] Cannot transfer to other classrooms
- [ ] Cannot exceed spendable balance (checking + sweepable savings)
- [ ] Reason required from preset list (no free text)
- [ ] Appears in **Activity history** for both parties

## Domain refs

- **Peer transfer**, **Transfer reason**

## Deferred

- Per-site **Transfer reason** seeds (`ofysb-mv`, etc.) when feature ships — user requested postpone

## Out of scope

- Request/approve transfers
- Limits per day
