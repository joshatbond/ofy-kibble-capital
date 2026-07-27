# Slice 6 — ms-engage attendance import

## Goal

Pull attendance and overtime (including **Cafe night**) from Turso (**ms-engage**) for a **Pay period** and classroom roster, keyed by **External student identifier**. Replace the Slice 5 stub attendance source with persisted import snapshots while keeping the same **Blocked pay run** contract.

## Dependencies

- Slice 5 (pay periods + pay run + attendance source contract)
- Slice 1 / 2 (classroom + roster ids)
- **ms-engage** schema extension for per-day presence + overtime hours (prerequisite in that repo)

## Deliverables

- Convex **action**: Drizzle/Turso query for date range = **Pay period** bounds, students in roster
- Map: present/absent (all-or-nothing day), **Overtime** hours per student
- Import snapshot stored (or ephemeral for pay run) for audit
- Swap stub → snapshot reader for pay run validation
- Pre–pay-run validation: any active student missing data → **Blocked pay run** (classroom-wide)

## Acceptance criteria

- [ ] Import uses **External student identifier** join only
- [ ] Present day = **Standard day hours**; absent = 0 unless **Approved PTO** handled in slice 7
- [ ] Turso failure → **Blocked pay run**, no partial pay
- [ ] Document env vars and query contract in `docs/ai/` or ADR companion note

## Domain refs

- **Attendance platform**, **Attendance record**, **Overtime**, **Cafe night**, **Blocked pay run**, **Pay period**
- ADR: [`0002-ms-engage-turso-attendance-import.md`](../adr/0002-ms-engage-turso-attendance-import.md)

## Out of scope

- Editing attendance in this app (fix in ms-engage + re-import)
- PTO approval (slice 7)

## Prerequisite ticket (ms-engage)

- [ ] Tables/API for daily attendance + overtime hours exportable by student id + date range
