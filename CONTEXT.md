# Student financial literacy platform

One codebase delivers two student PWAs (accounting-style earnings, banking-style money management) and a teacher admin hub, all backed by shared classroom-scoped data.

## Language

### Tenancy

**Organization**:
The tenant boundary for all payroll, banking, store, and roster data — maps one-to-one with a **Classroom**.
_Avoid_: Tenant (in user-facing copy), school (when meaning this boundary)

**Classroom**:
The group of students and teacher(s) running the simulation for one class period or cohort; exactly one **Organization** per classroom, linked to one **Site slug** (and its **Region**) from the operator catalog. In v1, **Classroom** **Organizations** are created by operator seed (not **Teacher** self-serve); **Teachers** join via **Invitation**.
_Avoid_: Class (alone — ambiguous with CSS/school "class"), course

**School site**:
A physical charter campus within a **Region**; most sites have one middle-school teacher running the platform, occasionally two. Identified by a canonical **Site slug** (e.g. `ofysb-mv`, `ofysb-sb1`, `ofysb-sb2`).
_Avoid_: School (alone — ambiguous with entire charter network), campus (unless user-facing)

**Region**:
A charter within the larger school network (e.g. a geographic or franchise subdivision); contains multiple **School sites**. Operator-maintained catalog (seeded), not **Teacher**-created in v1.
_Avoid_: District (unless that is the org's official term), charter (alone — overloaded)

**Site slug**:
Stable identifier for a **School site** in the operator catalog, format `{region}-{site}` (lowercase); used when seeding **Classrooms** and **Settings stack** defaults.
_Avoid_: School code (ambiguous), tenant slug (implementation)

**Settings stack**:
Layered defaults — **Region** → **School site** → **Classroom** — merged when resolving what a classroom runs with. Not a tenancy boundary; classrooms remain the only **Organization**.
_Avoid_: Nested org, parent tenant (implementation terms)

**Effective settings**:
The merged result of the **Settings stack** plus any **Classroom** overrides; what payroll, copy, and store logic read at runtime.
_Avoid_: Config, profile (too generic)

**Classroom override**:
A per-classroom value that replaces the **School site** or **Region** default for that field; survives **Settings propagation** until cleared or replaced.
_Avoid_: Custom setting, local config

**Settings propagation**:
An intentional push of updated **School site** (or **Region**) defaults into classrooms; classrooms without a **Classroom override** on a field receive the new value; fields with an override keep the teacher’s value. **Not in v1** — no site-wide actor; **Teachers** set **Classroom** values directly (defaults seeded at classroom create only).
_Avoid_: Sync, rollout, cascade (alone)

**Currency label**:
The classroom-facing name for simulated money (e.g. bark bucks, cub coins); set in **Effective settings**, often seeded from **School site** or **Region** defaults.
_Avoid_: Currency (implies ISO/legal tender), coins (alone)

**Money amount**:
All balances, paystub lines, and transfers are stored and calculated in integer **Cents** (display as dollars and cents in UI). Intermediate tax math rounds **half up** to the nearest cent per **Withholding line** (and per earning/deduction line as implemented).
_Avoid_: Dollars (alone), float (implementation)

### People

**Invitation**:
Email-based, invite-only onboarding — no public sign-up. **Teacher** invites **Students** by school email (`@ofy.org` **Google Workspace**); invitee opens neutral **`/invite/:id`**, signs in with Google using the **same email** (non-domain sign-ins rejected), accepts into the **Classroom** **Organization**, then lands on **Sign-in surface** if known else **Kibble Capital** by default. **Pending invitation** rows stay visible on the classroom roster until accepted. Links **expire after 14 days**; **Teacher** must **Resend invitation** to refresh.
_Avoid_: Sign-up, registration, class code (v1 avoided)

**Pending invitation**:
**Student** invite sent but not yet accepted — shown on **Teacher** roster (with **Pay token** for ID print); **Checking** and **Savings** provisioned empty at invite send; excluded from **Pay run** and **POS** until active. **Teacher** may **Resend invitation** email or **Revoke invitation** (invalidates link; may re-invite).
_Avoid_: Invited (alone), awaiting (verbose)

**Revoke invitation**:
Cancel a **Pending invitation** so the link no longer works; roster row removed or marked revoked until a new **Invitation** is sent.
_Avoid_: Delete invite (implementation)

**Teacher**:
An authenticated user who administers one or more **Classrooms** via **Organization** membership (payroll inputs, invitations, store POS). Two **Teachers** on the same **Classroom** are **Co-teachers** with equal power on that **Organization**.
_Avoid_: Admin (reserved for hub UX; not a separate role name unless defined later)

**Co-teacher**:
A second (or further) **Teacher** on the same **Organization**; same permissions as the first — shared **Classroom** settings and actions; one `classSettings` row per **Organization** (concurrent edits: last write wins in v1). Joins via **Invitation** by email (same mechanism as **Students**, **teacher** role).
_Avoid_: Assistant teacher, aide (implies reduced permissions)

**Student**:
An authenticated user invited into exactly one **Classroom** **Organization** for the simulation; always has access to both **Kibble Capital** and **PawKet Exchange** within that org (no per-app lockout in v1). Roster includes **Grade** (7 or 8), required at **Invitation**.
_Avoid_: User (too generic), learner

**Grade**:
**Student** school level — 7 or 8 only in v1 — captured when **Teacher** invites; supports **Audit retention** and middle-school scope.
_Avoid_: Year (ambiguous), class year

### Student apps (product names)

**Kibble Capital**:
The accounting-style student PWA for paystubs, deductions, earnings, **Pay split**, and **PTO request** status — used infrequently as an educational surface. New **Posted paystub**: **In-app badge** only (no push). **PTO decision notification** is the exception: **PWA notification** and/or **In-app badge** on **Kibble** when **Teacher** approves or denies **PTO request** (not **PawKet Exchange**). No in-app cross-links to **PawKet** in v1 — separate install / home screen. **Guided tour** in v1 (slice 11).
_Avoid_: Kinetic Ledger (Stitch/design alias only)

**PawKet Exchange**:
The banking-style student PWA students use routinely — balances, vaults, transfers, and **Student store** purchases; primary day-to-day student surface. **Net pay** arrival triggers a **Paycheck notification** (**PWA notification**). No in-app cross-links to **Kibble** in v1 — separate install / home screen. First-time **Student** **Guided tour** in v1 (slice 11).
_Avoid_: Vibrant Scholar (Stitch/design alias only)

**Guided tour**:
Step-by-step onboarding overlay in each student PWA separately (**PawKet Exchange** primary, **Kibble Capital** after pay-split wizard); skippable and replayable; no cross-app links.
_Avoid_: Tutorial (generic), product tour (marketing)

**Student store**:
The teacher-run in-class economy where **Students** spend simulated funds from **PawKet Exchange**, not from **Kibble Capital** directly.
_Avoid_: Shop, marketplace

**POS**:
Point-of-sale in **Teacher admin** — **Teacher** runs checkout, scans a **Student pay code**, selects items, and posts a debit. **Pay token** may exist before **Invitation** accept, but **POS** debits only **active** roster **Students** (invite accepted). Declines if **Checking** plus available **Sweep to checking** funds cannot cover the total (no negative balances). **Student** receives a **PWA notification** on **PawKet Exchange** when charged.
_Avoid_: Checkout, register

**Student pay code**:
QR on a **Student** ID (or equivalent) encoding an opaque **Pay token** mapped server-side to that **Student** in the **Classroom** — not the **External student identifier** or email (rotatable if compromised). **POS** scan identifies the payer; **Teacher** still completes the sale.
_Avoid_: QR code (implementation), payment card

**Pay token**:
The secret, opaque value behind a **Student pay code**; used only for **POS** lookup within the **Organization**. Created when **Teacher** sends a **Student** **Invitation** (before accept) so ID cards can be printed immediately. **Teacher** may **Rotate pay token** to invalidate a lost or compromised QR.
_Avoid_: Card number, student ID (in QR)

**Rotate pay token**:
**Teacher** action in **Teacher admin** that issues a new **Pay token** and retires the previous one.
_Avoid_: Reset QR, reissue (verbose)

**Declined payment**:
A **POS** attempt that fails because spendable balance is insufficient after **Sweep to checking** rules (**Vault** funds not spent via sweep).
_Avoid_: Insufficient funds (acceptable UI copy), overdraft (we disallow)

**Catalog item**:
A **Teacher**-defined **Student store** product (name, price) with unlimited stock in v1 — no inventory tracking. **Teacher** may **Deactivate** an item to hide from **POS**; history of past sales remains in **Activity history**.
_Avoid_: SKU, product (generic)

**Deactivate**:
Mark a **Catalog item** inactive (not sold at **POS**) without deleting past transaction records.
_Avoid_: Delete, archive (acceptable UI copy)

**Peer transfer**:
A **Student**-initiated send of simulated funds to another **Student** in the same **Classroom** **Organization** (v1 allowed; no cross-class sends). Limited only by spendable balance (no per-transfer or daily caps in v1). **Student** must pick a **Transfer reason** from a **Classroom** preset list (no free-text memo in v1). Recipient picker shows roster names only — not classmates’ balances. Recipients get a **PWA notification** on **PawKet Exchange** when funds arrive.
_Avoid_: P2P, Zelle (brand), payment (generic)

**Transfer reason**:
A preset label for **Peer transfer** — **Student** chooses one per send instead of free text. Defaults come from the **Settings stack** (**School site** list, **Classroom override** optional); **Teacher** can edit the classroom list in **Teacher admin**. Operator **Site slug** seed includes a starter list per site when the feature ships (deferred until **Peer transfer** slice).
_Avoid_: Memo, note (free-text)

### Payroll and banking

**Attendance platform**:
The external system (ms-engage today) where **Teachers** record real attendance in Turso; this product imports **Attendance record** rows per **Pay period** by shared **External student identifier** (same numeric student ID in both systems).
_Avoid_: Turso, Drizzle, ms-engage (implementation names — ok in ADRs/docs)

**External student identifier**:
The stable numeric student ID shared between the **Attendance platform** and this product’s roster — used to join imported attendance to **Students**. **Teacher** supplies it when sending a **Student** **Invitation** (required), together with **Grade**.
_Avoid_: student_id (code), SIS ID (unless official)

**Attendance record**:
A logged school-day presence for a **Student**, imported from the **Attendance platform** for a **Pay period**. v1: present = full **Standard day hours** for that date; absent = no hours (all-or-nothing per day) unless **Approved PTO** applies (see **PTO**).
_Avoid_: Check-in, absence (alone)

**PTO balance**:
Paid-time-off hours a **Student** has banked. Default accrual: 1 hour per **Pay period**, credited when a **Pay run** completes (**Teacher**-configurable accrual amount per **Classroom**).
_Avoid_: Vacation balance, leave bank

**PTO accrual**:
Hours added to **PTO balance** at **Pay run** completion (not at **Pay period** start).
_Avoid_: Grant, allotment (alone)

**PTO request**:
A **Student** ask to use **PTO balance** for date(s) in the current **Pay period** or the future — not dates in a closed (already paid) **Pay period**. **Student** may cancel while still pending. **Teacher** approves or denies in **Teacher admin**; outcome surfaced in **Kibble Capital** via **PTO decision notification**. New submission triggers **PTO pending notification** to **Co-teachers**.
_Avoid_: Absence request (deprecated term), leave request

**PTO pending notification**:
When a **Student** submits **PTO request**: **PWA notification**, **Email alert** (Resend), and in-session indicator in **Teacher admin** for **Co-teachers**.
_Avoid_: Approval request (generic)

**PTO decision notification**:
**PWA notification** and/or **In-app badge** on **Kibble Capital** when a **PTO request** is approved or denied — the rare student alert on the earnings app (not **PawKet Exchange**).
_Avoid_: PTO alert (generic)

**Approved PTO**:
A **PTO request** the **Teacher** accepted only if **PTO balance** covers full **Standard day hours** for each requested date (otherwise deny). For an approved date absent in the **Attendance platform** import: that date counts as **Days attended**; **PTO balance** decreases by **Standard day hours**. If import already shows present, present wins (no **PTO** spend for that date).
_Avoid_: Excused absence (school-office term)

**Days attended**:
Count of days in the **Pay period** where the **Student** has qualifying **Attendance record** entries — drives base gross before **Overtime**.
_Avoid_: Hours (ambiguous with **Overtime** hours)

**Standard day hours**:
How many paid hours one **Attendance record** day represents for base pay (e.g. 4 hours for a four-hour school day). Configurable per **School site** in the **Settings stack**, with **Classroom override** possible — sites differ (e.g. four hours × four days per week vs one hour × two days).
_Avoid_: Full day, period length

**Hourly rate**:
Single pretend wage per **Classroom** in **Effective settings** applied to all **Students** for **Base hours** and the base portion of **Overtime** math in v1.
_Avoid_: Pay rate (generic), salary

**Base hours**:
**Days attended** × **Standard day hours**, paid at the normal hourly rate before **Overtime** lines are added.
_Avoid_: Regular hours (acceptable alias)

**Gross pay**:
Total earnings for a **Pay period** before any deductions (**Base hours**, **Overtime**, and any other earning lines).
_Avoid_: Pre-tax (jargon)

**Pre-tax deduction**:
Amounts subtracted from **Gross pay** before tax **Withholding line** calculations — v1 includes **401(k) contribution** and **Medical insurance** (simulated benefits).
_Avoid_: Deduction (too broad), benefit (vague)

**401(k) contribution**:
Simulated retirement deferral **Pre-tax deduction** on the paystub (educational; not a real plan). **Classroom** default: **percent of gross** for all **Students** in v1 (not per-student election).
_Avoid_: Retirement, 401k (missing parentheses in formal copy)

**Medical insurance**:
Simulated health premium **Pre-tax deduction** on the paystub. **Classroom** default: **fixed dollars per Pay run** for all **Students** in v1.
_Avoid_: Health insurance (acceptable in UI copy)

**Taxable wages**:
**Gross pay** minus **Pre-tax deduction** totals — basis for graduated federal and California tax **Withholding line** math.
_Avoid_: Taxable income (IRS phrase — use in teaching copy sparingly)

**School year**:
The period for payroll **YTD** accumulation; resets each **July 1** for every **Classroom** (v1 fixed, not per-site configurable).
_Avoid_: Academic year (acceptable alias), fiscal year

**Year-to-date (YTD)**:
Cumulative **Gross pay**, **Pre-tax deduction**, **Withholding line**, and **Net pay** totals per **Student** within the current **School year** — federal and California graduated tax each **Pay run** use **YTD**; counters reset on **July 1**.
_Avoid_: Running total, cumulative (alone)

**Filing assumption**:
Every **Student** is treated as Single with zero allowances for withholding tables — not editable in v1.
_Avoid_: W-4, exemptions

**Withholding line**:
A single deduction on a paystub with a label and amount. v1 set mirrors California wage earner reality: **Federal income tax** (graduated brackets), **California state income tax** (graduated brackets), **Social Security**, **Medicare**, **CA SDI**.
_Avoid_: Deduction (too broad — includes voluntary deductions later)

**Federal income tax**:
Graduated **Withholding line** using federal bracket logic (California-based product defaults; not flat percent-only in v1 intent).
_Avoid_: Fed tax (in UI copy only)

**California state income tax**:
Graduated **Withholding line** using California state bracket logic.
_Avoid_: State tax (ambiguous outside CA)

**Social Security**:
**Withholding line** for FICA Social Security portion, subject to annual wage base cap (stops after cap within **School year** **YTD**); Medicare does not share that cap in v1.
_Avoid_: FICA (umbrella — Medicare is separate)

**Wage base cap**:
Annual limit for **Social Security** withholding — modeled in v1; **Medicare** remains on all **Taxable wages** without additional surtax tier yet.
_Avoid_: FICA limit (informal)

**Medicare**:
**Withholding line** for FICA Medicare portion.
_Avoid_: FICA (umbrella)

**CA SDI**:
California State Disability Insurance **Withholding line**.
_Avoid_: SDI (ambiguous), disability tax (verbose)

**Net pay**:
**Gross pay** minus **Pre-tax deduction** and all **Withholding line** amounts; credited to **PawKet Exchange** on **Pay run**.

**Paystub**:
The **Kibble Capital** earnings statement for one **Student** and **Pay period**, with gross, **Pre-tax deduction**, **Withholding line**, and **Net pay** lines. **Posted paystub** records are immutable in v1 — fixes use a later **Pay run** (e.g. true-up line), not editing the original.
_Avoid_: Payslip (acceptable UI copy), paycheck PDF (format)

**Posted paystub**:
A **Paystub** finalized by a completed **Pay run**; cannot be edited in v1.
_Avoid_: Final paystub, locked (implementation)

**Payroll correction**:
An earning or deduction adjustment line on a later **Paystub** (after a **Posted paystub** error) — the v1 way to fix mistakes without editing history. **Teacher** enters amount and mandatory reason in **Teacher admin** before the affected **Pay run**.
_Avoid_: True-up (colloquial), amend (IRS tone)

### PawKet (banking)

**Checking**:
The **Student** spending account in **PawKet Exchange** — **Student store** debits and peer sends pull from here first.
_Avoid_: Checking account (verbose in definitions), primary account

**Savings**:
The **Student** reserve account holding funds not in **Checking** or earmarked in **Vaults**; earns **Savings interest** on total **Savings** balance including **Vault** balances. Can **Sweep to checking** when **Checking** cannot cover a debit (unallocated **Savings** only — **Vault** balances protected).
_Avoid_: Savings account (verbose in definitions)

**Savings APY**:
Annual percentage yield on all **Savings** money (unallocated plus **Vault** balances), set per **Classroom** by **Teacher** (v1 default 3.3%).
_Avoid_: Interest rate (generic)

**Interest accrual**:
Monthly job on the **1st of the calendar month** that credits **Savings interest** to **Students** using **Average daily balance** over the prior calendar month and **Savings APY** (all **Classrooms** same schedule in v1).
_Avoid_: Compound, dividend (alone)

**Average daily balance**:
The mean end-of-day **Savings** total (unallocated plus all **Vault** balances) across the prior month — basis for **Interest accrual**.
_Avoid_: ADB (abbreviation in UI only)

**Vault**:
A **Student**-defined savings goal inside **Savings**, created through **Vault setup**: name/purpose, optional **Savings goal** target, icon, and a **Vault funding mode**. Count per **Student** is capped by **Classroom** **Effective settings** (v1 default: 5 active vaults).
_Avoid_: Envelope, pot, sub-account (implementation)

**Vault setup**:
Student wizard in **PawKet Exchange**: (1) what they are saving for — pick from product-wide **Common vault goal** presets or custom label + icon/emoji; (2) optional **Savings goal** dollar target (uncapped if omitted); (3) how to fund — maps to **Vault funding mode**.
_Avoid_: Create vault (UI copy)

**Common vault goal**:
Product-default savings purpose templates (label + icon) offered in **Vault setup** step 1 — same list for all **Classrooms** in v1.
_Avoid_: Goal template (generic)

**Savings goal**:
Optional target **Money amount** for a **Vault**; uncapped when not set.
_Avoid_: Goal amount (generic)

**Goal reached**:
When a **Vault** balance meets or exceeds its **Savings goal**, the vault is **Complete** — **On deposit** and **Scheduled** funding stop; only **Manual** adds allowed until **Student** raises the goal or closes the vault.
_Avoid_: Fully funded, done (ambiguous)

**Close vault**:
**Student** ends a **Vault**; remaining balance **auto-liquidates** to unallocated **Savings**, then the vault is archived (not shown in active list).
_Avoid_: Delete vault, remove goal (ambiguous)

**Manual vault transfer**:
**Student**-initiated move between unallocated **Savings** and a **Vault** in either direction, including when **Goal reached** (**Complete**) — closing the vault is not required to withdraw.
_Avoid_: Transfer (alone), allocation (automation)

**Vault funding mode**:
How a **Vault** is funded, chosen in **Vault setup**:

- **On deposit** — “Save from every direct deposit”: allocate from each paycheck’s **Savings** slice after **Pay split** (see **On deposit allocation**).
- **Scheduled** — “Set up recurring transfers” from **Savings** into the **Vault** on a student-defined recurring schedule.
- **Manual** — “One-time transfer” now, then add manually later; no automatic funding.
  _Avoid_: Auto-fund (generic)

**On deposit allocation**:
Per **Vault** with **On deposit** mode: share of **Net pay** (percent or fixed **Cents**) taken as the **first cut** when a deposit hits — before **Pay split** — regardless of eventual **Checking** vs **Savings** split. Sum of all **On deposit** rules cannot exceed 100% of that deposit (validation at **Vault setup**).
_Avoid_: Auto-save percent (alone)

**Recurring vault transfer**:
**Scheduled** moves from unallocated **Savings** into a **Vault** on a student-chosen cadence: weekly, bi-weekly, or monthly (v1). If funds are insufficient, the transfer is skipped and the **Student** sees an in-session notice in **PawKet Exchange** only (no **PWA notification**, no home-screen icon badge).
_Avoid_: Standing order (UK tone)

**Transfer skipped notice**:
In-app-only message in **PawKet Exchange** when a **Recurring vault transfer** could not run due to low unallocated **Savings**.
_Avoid_: Failed transfer push, alert (generic)

**Pay split**:
**Student**-configured percentage of each **Net pay** between **Savings** and **Checking**, set in **Kibble Capital**. Until configured: **Net pay** goes **100% to Checking**; first visit to **Kibble Capital** requires completing pay-split setup (wizard) before other Kibble features. After setup, **Pay split** applies on future **Pay runs**. **Teachers** can view each **Student**’s split read-only in **Teacher admin**.
_Avoid_: Allocation, split (alone)

**PawKet automation**:
Rules in **PawKet Exchange** triggered on events (e.g. paycheck received) — moving funds between **Checking**, **Savings**, and **Vaults** according to **Vault funding mode** and student choices.
_Avoid_: Rule, workflow (implementation)

**Paycheck allocation**:
The combined effect when **Net pay** arrives: **On deposit** **Vault** cuts first, then **Pay split** (Kibble) on the remainder, plus any **Scheduled** / **Manual** **Vault** rules.
_Avoid_: Auto-save rule

**Sweep to checking**:
When a debit exceeds **Checking** balance, move funds only from unallocated **Savings** (not from **Vault** balances) into **Checking** to complete the payment.
_Avoid_: Overdraft protection, backup balance

**Activity history**:
Append-only ledger of **Money amount** movements for a **Student**. **Student** sees their own (pay, **POS**, **Peer transfer**, interest, sweeps, vault moves); **Teacher** sees all **Students** in the **Classroom**.
_Avoid_: Transaction log (implementation), statement (banking jargon)

**Paycheck pipeline**:
When **Net pay** arrives from a **Pay run**: (1) credit deposit; (2) **On deposit** **Vault** rules take the **first cut** from full **Net pay**; (3) **Pay split** divides the **remainder** between **Savings** and **Checking**; (4) **Scheduled** / **Manual** **Vaults** unchanged by this step. **Sweep to checking** applies later on spend, not at deposit.
_Avoid_: Deposit flow, allocation order (implementation)

**Overtime**:
Extra paid hours outside the normal school day (including **Cafe night**), imported from the **Attendance platform** — paid at the **Overtime multiplier** on top of **Days attended**-based pay.
_Avoid_: Extra credit, bonus (unless defined separately)

**Overtime multiplier**:
Per-**Classroom** factor applied to **Overtime** hours only (v1 default: 1.5× the normal hourly rate unless **Teacher** sets otherwise in **Effective settings**).
_Avoid_: Time and a half (phrase, not the term), double time (specific factor)

**Cafe night**:
An optional evening session where **Students** do extra work; **Overtime** hours are recorded in the **Attendance platform** (extended ms-engage tracker) and imported for the **Pay period** — not entered in **Teacher admin** here in v1.
_Avoid_: After school, tutoring

**Pay period**:
The calendar window of work (attendance, hours) that a single classroom payday covers — **calendar-aligned**, not rolling since last **Pay run**. Boundaries by **Pay schedule** type:

- **Weekly:** prior Monday–Sunday (the week before payday week).
- **Bi-weekly:** prior two full Monday–Sunday weeks.
- **Semi-monthly:** prior calendar half-month — either 1st–15th or 16th–last day of month (pay dates typically the 15th and last day of month).
- **Monthly:** prior calendar month (1st through last day).
  _Avoid_: Pay cycle (acceptable alias), pay date (that's an instant)

**Pay schedule**:
Per-**Classroom** configuration for when **Payday automation** runs. v1 choices: weekly on a **Weekday**; bi-weekly on a **Weekday**; semi-monthly on two **Days of month**; monthly on one **Day of month**. **Bi-weekly** phase is anchored by **First pay date**.
_Avoid_: Cadence (alone), cron expression

**First pay date**:
The anchor date for **Pay schedule** math (especially **Bi-weekly** parity). Default for a new **Classroom**: **July 1** of the current **School year** + one **Pay period** length + one week (exact formula in implementation).
_Avoid_: Start date (ambiguous), payroll start

**Pay schedule change**:
When a **Teacher** changes **Pay schedule** type or anchors: keep the current rhythm until existing **Pay period** ranges would align with the new type; then switch. If types do not align (e.g. **Bi-weekly** → **Semi-monthly**), insert one **Transition pay period** on the next available pay date to cover the gap between the old window and the new schedule.
_Avoid_: Migration, cutover (implementation)

**Transition pay period**:
A one-off **Pay period** with non-standard calendar boundaries so attendance and pay are not lost when **Pay schedule change** would otherwise leave a gap or overlap.
_Avoid_: Stub period, catch-up (colloquial)

**Weekday**:
Day of week anchor for weekly or bi-weekly **Pay schedule** entries.
_Avoid_: Day (ambiguous with day-of-month)

**Day of month**:
Calendar date anchor (1–28/29/30/31 — product must define handling of short months) for semi-monthly or monthly **Pay schedule** entries.
_Avoid_: Date (implies full calendar date with month)

**Pay run**:
A classroom-wide batch that finalizes earnings for a **Pay period**, produces paystubs in **Kibble Capital**, and credits net pay to **PawKet Exchange** for every roster **Student** — normally triggered by automation. At most **one successful Pay run** per **Pay period** (idempotent; retries only after failure or **Blocked** state, not after success). If the **Attendance platform** import fails or any active **Student** lacks data for the period, the **Pay run** is **Blocked** (no partial pay in v1).
_Avoid_: Payroll run (verbose), batch (alone)

**Blocked pay run**:
A **Pay run** that did not execute because preconditions failed (import error, missing attendance for a roster student, etc.); **Teachers** fix upstream data or **Postpone pay run**, then retry.
_Avoid_: Failed payroll (verbose)

**Payday automation**:
The scheduled **Pay run** for each **Pay period** (e.g. “run every pay period”); **Teachers** receive advance notice before it executes so they can correct hours, absences, or settings. Runs at **Pay run time** in **Product timezone** (v1 default **8:30 AM** PT) on calendar **Pay schedule** dates even on school holidays — **Teacher** uses **Postpone pay run** when school is out.
_Avoid_: Cron, job (implementation)

**Pay run time**:
Clock time when **Payday automation** executes on pay day — v1 product default **8:30 AM** `America/Los_Angeles` for all **Classrooms** (not per-classroom configurable).
_Avoid_: Payday hour, cron (implementation)

**Product timezone**:
`America/Los_Angeles` for all **Payday automation**, **Payday notice**, and **Interest accrual** scheduling in v1 (California charter assumption).
_Avoid_: School timezone (deferred), UTC (implementation default)

**Manual pay run**:
A **Teacher**-initiated **Pay run** for the current **Pay period** with the same preconditions as **Payday automation** (import complete, no **Blocked pay run** conditions) — e.g. after fixing attendance or a **Transition pay period**.
_Avoid_: Force pay, override (implies skipping guards)

**Payday notice**:
The alert to **Co-teachers** that a **Payday automation** will execute soon, delivered via **PWA notification** (when opted in) and **Email alert** (Resend). Lead time is **Teacher**-configurable per **Classroom** (1–7 **calendar** days before run, in **Product timezone** — not weekdays-only). The editable window is fixes in the **Attendance platform** (re-import before run), pending **PTO request** decisions, and **skip or postpone** for that **Pay period** — not **Effective settings** (those apply when the **Pay run** executes) and not per-student exclusion (unenrolled **Students** are removed instead).
_Avoid_: Reminder, notification (too generic)

**PWA notification**:
Push or on-device alert through the installed PWA (scoped per app/surface — e.g. **Teacher admin** for **Payday notice**).
_Avoid_: Push (alone), toast (in-session only)

**Offline read-only**:
Installed PWAs may show last-synced balances and **Activity history** without network; no **POS**, **Peer transfer**, or other money-moving actions until online (v1).
_Avoid_: Offline mode (ambiguous), cache (implementation)

**Email alert**:
Transactional email via Resend for time-sensitive events (e.g. **Payday notice** to **Teachers**; not used for student payday in v1).
_Avoid_: Newsletter, marketing email

**Paycheck notification**:
**PWA notification** to **Students** on **PawKet Exchange** when **Net pay** lands from a **Pay run** (e.g. “Paycheck received”).
_Avoid_: Payment alert (generic)

**In-app badge**:
Unread indicator inside an app’s UI only — e.g. new paystub in **Kibble Capital** — without changing the installed PWA home-screen icon badge count.
_Avoid_: App icon badge, push (for Kibble paystub in v1)

**Postpone pay run**:
Delay the scheduled **Payday automation** for the current **Pay period** to a later date after a **Payday notice** (e.g. snow day, incomplete attendance, or while resolving a **Blocked pay run**).
_Avoid_: Skip (ambiguous with cancel), defer

**Unenrollment**:
Removing a **Student** from active participation in the **Classroom** **Organization**, initiated by a **Teacher** or **Co-teacher** only (not self-serve, not operator UI in v1). They no longer sign in or appear on **Pay runs**, but historical paystubs and ledger data remain for **Teachers** (soft archive in v1).
_Avoid_: Delete, purge (reserved for a later **Audit retention** process)

**Archived student**:
A **Student** after **Unenrollment** — no access, read-only history for **Teachers** until **Audit retention** removes them.
_Avoid_: Inactive user, former student

**Audit retention**:
A future policy-driven purge of **Archived student** data after a fixed window (planned: two years; aligns with middle school grades 7–8 only — no long-lived student cohort in product intent).
_Avoid_: GDPR job, data deletion (implementation)

**Teacher admin**:
The teacher-facing hub for classroom setup, payroll inputs, **POS**, and invitations — not a third student brand. After sign-in, **Teachers** always land on **Teacher admin** (not student app routes). v1 assumes one **Classroom** per **Teacher** session (no classroom switcher; multi-org deferred).
_Avoid_: Admin app (ambiguous with system administration)

**Sign-in surface**:
Which student PWA the user authenticated from (**Kibble Capital** or **PawKet Exchange** marketing/install path). After OAuth, **Students** land on that app’s signed-in home. Unknown surface after **Invitation** accept defaults to **Kibble Capital**.
_Avoid_: Last-used app (deferred), deep link (implementation)

## Engineering

Planned tooling and verification that sit outside the domain glossary but shape how we build UI and money logic.

### UI build policy

How styling and layout progress across implementation slices — see [docs/scope/README.md](docs/scope/README.md#ui-build-policy).

**Design system (slice 1):** Tokens, shadcn, `AppTheme`, SSR marketing landings, loaders, **Storybook** bootstrap. Required **before slice 3** (banking shell and later feature routes depend on composable UI).

**Functional feature UI (slices 2–10):** Real data and flows with **wireframe fidelity** — tokens and primitives, readable lists/forms, correct **Cents** display. **Not** deferred to “unstyled pages”; **Stitch polish**, guided tours, and marketing-quality layout passes wait for **slice 11**.

**Polish (slice 11):** Stitch-aligned screens, tours, accessibility pass, optional visual-regression on golden Storybook stories.

_Avoid_: Feature slices that invent one-off CSS outside the design system; treating slice 11 as the first slice that may use Tailwind

### Component catalog (Storybook)

A **Storybook** workshop for React UI — not shipped yet. Use it to render components in isolation, force props and states (loading, empty, error, wizard steps), and preview **Kibble Capital** vs **PawKet Exchange** styling under `AppTheme` without signing in or routing through the full app.

**Why Storybook (not a big component test suite):** Layout, loaders, landings, and theme tokens are easier to review and iterate in a catalog than with React Testing Library or route-level clicks. **Money and rules** (**Paycheck pipeline**, **Withholding line**, **Cents**, ADR-0001 bracket fixtures) belong in unit/integration tests, not stories.

**When to add it:** Bootstrap in [slice 1 — Foundation](docs/scope/01-foundation.md) (before slice 3). Add stories when reusable components land in slices 2–10. Slice 11 expands composed feature stories and may add optional CI snapshots.

**Optional later:** Visual-regression snapshots on a small golden story set in CI (Chromatic, Playwright, etc.) — only if manual Storybook review stops catching unintended drift.

**Out of scope for the catalog:** Proving payroll math; wiring every Convex query (use fixtures or thin mocks only where a story needs data).

_Avoid_: Treating Storybook as a substitute for paystub or pipeline tests; deferring Storybook to slice 11 while building styled landings in slice 1 without a catalog

### Testing (money and rules)

Automated tests target **public interfaces** for domain logic — e.g. **Paycheck pipeline** with fixed **Cents** inputs (slice 4), California payroll bracket fixtures (ADR-0001, slice 6), auth redirect allowlists. React component unit tests are low priority; see **Component catalog** for UI craft.

## Flagged ambiguities

_(none)_

## Example dialogue

**Dev:** "Does the paystub belong to the school or the class?"

**Expert:** "The **Classroom** — one **Organization**. Your site might only run one **Classroom** today, but another **School site** in another **Region** is the same shape: their own **Organization**, tagged with their **Region** and **School site**."

**Dev:** "Can a **Student** be in two **Classrooms**?"

**Expert:** "Not in v1 product intent — one invite, one **Organization**. A **Teacher** with two periods is two **Organizations**, same **Teacher** user."

**Dev:** "Kid was absent but had PTO approved."

**Expert:** "Counts as a paid day — full **Standard day hours** — and we debit their **PTO balance**."

**Dev:** "Where do hours come from?"

**Expert:** "**Days attended** from **Attendance record** — your existing tracker. **Cafe night** **Overtime** is recorded there too and imported for payday."

**Dev:** "Is 401(k) taken out before tax?"

**Expert:** "Yes — **Pre-tax deduction** first, then **Withholding line** on **Taxable wages**. **YTD** drives the next bracket step. Every **Student** uses the same **Filing assumption**."

**Dev:** "Checking or savings for the store?"

**Expert:** "**On deposit** vaults take the first cut from the paycheck. What's left is **Pay split** between **Checking** and **Savings**. **Checking** spends; empty? **Sweep to checking** from unallocated **Savings** only."

**Dev:** "Who moves money from the paystub to the bank?"

**Expert:** "The **Pay run** — usually **Payday automation** after a **Payday notice**. **Students** don't tap deposit in v1; **Kibble** shows the stub, **PawKet** gets the credit the same run."

**Dev:** "Do students need two accounts?"

**Expert:** "One **Student**, one **Organization** — two apps. **Kibble Capital** when a paystub lands; **PawKet Exchange** most days for the **Student store** and moving money."

**Dev:** "Can a kid join with a random Gmail?"

**Expert:** "No — **Invitation** to their school email; sign-in must match."

**Dev:** "Can I skip one kid on payday?"

**Expert:** "No partial roster on a **Pay run** — **Unenrollment** removes them. Everyone still on the roster gets paid when automation fires."

**Dev:** "If the site changes the currency label, does every class update overnight?"

**Expert:** "Only on **Settings propagation** — and only for fields without a **Classroom override**. Teacher A renamed currency to 'paw points' — that **Classroom override** stays. Teacher B never touched it — they get the site default after propagation."
