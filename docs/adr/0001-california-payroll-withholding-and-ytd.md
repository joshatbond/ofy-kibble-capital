---
status: accepted
---

# California payroll withholding with school-year YTD

Kibble Capital paystubs are meant to teach real take-home pay, not a single “minus 15%” shortcut. We compute **gross → pre-tax deductions → taxable wages → withholding lines → net pay** per student per pay run, using **California-shaped** rules: graduated **federal** and **California state** income tax, **Social Security**, **Medicare**, and **CA SDI**. Pre-tax lines in v1 are classroom-wide defaults for simulated **401(k)** and **medical insurance** (not per-student elections). Every student uses a fixed **filing assumption** (Single, zero allowances).

Withholding uses **cumulative year-to-date (YTD)** per student within a **school year** that resets every **July 1** (middle-school grades 7–8; no multi-year student cohort). That matches real W-2 thinking better than annualizing from a single check alone, especially when overtime and irregular cafe-night hours vary.

**Considered options:** Flat percentage buckets (rejected — too far from classroom realism); annualize-from-this-check only (rejected — weaker accuracy across pay periods); per-student W-4 editing in v1 (rejected — unnecessary complexity).

**Consequences:** Payroll logic is a dedicated module with test fixtures against published bracket tables; tax table updates are explicit maintenance. Net pay from each pay run feeds PawKet via the agreed paycheck pipeline. Changing state basis later (non-CA sites) is a product expansion, not a tweak. **Social Security** respects annual wage base caps; **Medicare** does not use an additional surtax tier in v1.
