# Slice 7 — PTO

## Goal

Student **PTO request** workflow in Kibble; teacher approve/deny in admin; pay run respects **Approved PTO** on absent days.

## Dependencies

- Slice 5 (absent days in import)
- Slice 6 (pay run applies PTO debit + paid day credit)
- Slice 10 (notifications)

## Deliverables

- **PTO balance** per student; **PTO accrual** on pay run (configurable hours, default 1)
- Student: request date(s) in current **Pay period** or future only; cancel while pending
- Teacher: approve/deny; deny if balance &lt; **Standard day hours** per date
- Pay run: absent + **Approved PTO** → **Days attended** + debit **PTO balance**; present wins
- **PTO pending notification** → teachers (PWA + email + admin indicator)
- **PTO decision notification** → student on **Kibble** (PWA and/or in-app badge — not PawKet)

## Acceptance criteria

- [ ] Cannot request dates in closed **Pay period**
- [ ] Approved PTO without balance at approval time is rejected
- [ ] Pay run reflects approved PTO against import absent days
- [ ] Student cancel clears pending request

## Domain refs

- **PTO balance**, **PTO request**, **Approved PTO**, **PTO accrual**, **PTO pending notification**, **PTO decision notification**

## Out of scope

- PTO in PawKet
