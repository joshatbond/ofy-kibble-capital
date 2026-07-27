# Slice 5 — Payroll engine

## Goal

End-to-end **Pay run**: attendance source → gross → pre-tax → CA/federal **YTD** withholding → **Posted paystub** → credit **Net pay** through **Paycheck pipeline**.

v1 uses a **stub attendance source** (weekdays present, zero overtime) so the engine can ship before live **Attendance platform** import. Slice 6 replaces the stub with Turso-backed snapshots; the same **Blocked pay run** guards apply when the attendance source is incomplete or fails.

## Dependencies

- Slice 4 (paycheck pipeline)
- Slice 3 (ledger)
- Slice 2 (active roster)

## Deliverables

### Pay calendar

- **Pay period** generator: calendar-aligned windows (weekly Mon–Sun, bi-weekly ×2, semi-monthly 1–15 / 16–EOM, monthly prior month)
- **First pay date** default: July 1 + period length + 1 week; **Pay schedule change** + **Transition pay period** per ADR-0004
- **Payday automation** 8:30 AM **Product timezone**; **Payday notice** 1–7 calendar days configurable
- **Manual pay run** same guards as automation
- One successful **Pay run** per **Pay period** (idempotent)
- Holidays: still run; **Postpone pay run** manual

### Attendance source (stub)

- Internal contract: per active roster student, days present/absent in the **Pay period** + **Overtime** hours
- Stub: every weekday in range = present; overtime = 0
- **Blocked pay run** when any active student is missing from the source or the source reports failure (classroom-wide; no partial pay)

### Payroll math

- **Base hours** = **Days attended** × **Standard day hours** × **Hourly rate**
- **Overtime** × **Overtime multiplier** (default 1.5)
- **Pre-tax**: 401(k) % of gross; medical fixed $ per run
- **Withholding lines**: federal + CA graduated (**YTD**), SS (**Wage base cap**), Medicare, **CA SDI**; half-up per line
- **Filing assumption** Single / 0 allowances
- **School year** **YTD** reset July 1
- **PTO accrual** at successful run (default 1 hour) — balance logic with slice 7
- **Posted paystub** immutable
- **Payroll correction** lines on later run (teacher + mandatory reason)

### Kibble UI

- Paystub list + detail for student
- New stub: **In-app badge** only (no push)

### Integration

- On success: **Net pay** → slice 4 pipeline; **Paycheck notification** (slice 10)

## Acceptance criteria

- [ ] **Blocked pay run** when attendance source incomplete
- [ ] Paystubs show all **Withholding line** types
- [ ] SS stops after annual cap within **School year**
- [ ] **Net pay** ledger matches stub
- [ ] **Manual pay run** works after block cleared

## Domain refs

- **Pay run**, **Paystub**, **Posted paystub**, **Gross pay**, **Net pay**, **YTD**, **Payroll correction**, **Payday automation**, **Payday notice**, **Manual pay run**, **Postpone pay run**
- ADR: [`0001-california-payroll-withholding-and-ytd.md`](../adr/0001-california-payroll-withholding-and-ytd.md), [`0004-pay-schedule-anchor-and-transition-periods.md`](../adr/0004-pay-schedule-anchor-and-transition-periods.md)

## Out of scope

- Live **Attendance platform** import (slice 6)
- Monthly **Interest accrual** (can land here or slice 11; see ADR-0003)

### Interest accrual (same slice or 11)

- 1st of month, **Average daily balance**, **Savings APY** default 3.3%, vault + unallocated
