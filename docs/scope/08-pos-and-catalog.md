# Slice 8 — POS & catalog

## Goal

Teacher **Student store**: **Catalog item** CRUD, **POS** QR checkout, student purchase alerts.

## Dependencies

- Slice 2 (pay tokens, active students)
- Slice 3 (ledger debit, sweep)
- Slice 10 (PWA push for purchase)

## Deliverables

- **Catalog item**: name, price (**Cents**), **Deactivate** (hide from POS)
- **POS** UI in **Teacher admin**: scan **Student pay code**, cart, confirm
- Lookup by **Pay token**; decline if not active member
- Debit **Checking** then **Sweep to checking**; **Declined payment** if insufficient (no negative)
- **Student** **PWA notification** on PawKet: purchase amount

## Acceptance criteria

- [ ] Pending invite token scans but cannot charge
- [ ] Deactivated items not in POS picker
- [ ] Receipt appears in **Activity history** for student and teacher views
- [ ] Decline shows clear reason (insufficient funds)

## Domain refs

- **Catalog item**, **Deactivate**, **POS**, **Student pay code**, **Pay token**, **Declined payment**, **Student store**

## Out of scope

- Inventory/stock counts
- Tax on store purchases
