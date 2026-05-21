---
status: accepted
---

# Pay schedule anchor and transition pay periods

Pay periods are calendar-aligned (prior Mon–Sun, two weeks, 15-day semi-monthly window, or prior calendar month)—not rolling “since last run.” Bi-weekly parity is anchored by a per-classroom **first pay date**, defaulting from July 1 + one period length + one week for new classrooms.

When teachers change pay schedule type, we do not flip mid-cycle blindly: the old rhythm continues until period boundaries would align with the new type. If types cannot align (e.g. bi-weekly → semi-monthly), we insert a single **transition pay period** on the next pay date whose date range covers the gap so attendance import and pay are neither skipped nor double-paid.

**Considered options:** Rolling periods since last pay run (rejected — poor fit with postpone and calendar teaching language); immediate cutover on settings save (rejected — overlap/gap risk).

**Consequences:** Pay period generation is a small state machine per classroom; schedule edits need UX explaining the transition period; attendance import queries must accept variable period bounds. **Pay run time** defaults to 8:30 AM `America/Los_Angeles`; **Payday notice** lead is 1–3 days per classroom (see glossary).
