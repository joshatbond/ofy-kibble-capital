---
status: accepted
---

# Attendance and overtime from ms-engage (Turso)

Days attended and overtime (including cafe night) are **not** the source of truth inside ofy-kibble-capital. Teachers already record attendance in **ms-engage**, backed by **Turso** with **Drizzle** (see `ms-engage` at `c:\Users\joshuarichardson_ofy\Documents\code\ms-engage`). At pay run time we **query/import** attendance for the active **pay period** and classroom roster, joining on a shared **external student identifier** (numeric student ID) that teachers supply when inviting a student.

Present/absent for base pay is **all-or-nothing per day** (full **standard day hours** or zero). **Approved PTO** can turn an imported absent day into a paid day and debit PTO balance. **Overtime** hours—including cafe night—will be recorded in the **extended** ms-engage tracker and imported the same way, rather than typed into Teacher admin here.

**Considered options:** Manual attendance mirror in Kibble (rejected — duplicate data entry); real-time sync on every mark (rejected — unnecessary coupling for payday-batch payroll); nested school-site tenant orgs for settings cascade (rejected — flat classroom org + settings stack; see glossary).

**Consequences:** Pay run needs a Convex **action** (or equivalent) that can reach Turso with credentials stored in deployment env—not query-time reads from the browser. Import failures block or partially block pay run (policy TBD in implementation). ms-engage schema changes for cafe night/overtime are a prerequisite for that slice. PTO requests/approvals remain in this product; only daily presence and overtime hours come from ms-engage.
