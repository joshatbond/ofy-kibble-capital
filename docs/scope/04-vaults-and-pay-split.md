# Slice 4 — Vaults & pay split

## Goal

Student savings behavior: **Pay split** wizard in Kibble, vault setup in PawKet, and **Paycheck pipeline** on pay deposit (vault first cut → pay split remainder).

## Dependencies

- Slice 3 (ledger accounts)
- Slice 6 will call pipeline on **Net pay** credit (stub credit mutation testable here)

## Deliverables

### Kibble

- First-login gate: **Pay split** wizard required before other Kibble features
- Until set: **Net pay** → 100% **Checking** (test hook)
- **Teacher** read-only view of each **Student** **Pay split**

### PawKet — Vault setup wizard

1. **Common vault goal** presets (product defaults) or custom + icon/emoji  
2. Optional **Savings goal** (**Cents**); uncapped if omitted  
3. **Vault funding mode**: **On deposit** | **Scheduled** | **Manual**  
   - **On deposit**: % or fixed **Cents** of **Net pay**, first cut; sum ≤ 100% across on-deposit vaults  
   - **Scheduled**: weekly | bi-weekly | monthly from unallocated **Savings**  
   - **Manual**: one-time + **Manual vault transfer** later  
- Vault cap per classroom (default 5)
- **Goal reached** → **Complete**: stop auto funding; manual in/out still allowed
- **Close vault** → liquidate to unallocated **Savings**, archive

### Paycheck pipeline (shared lib)

1. Credit **Net pay**  
2. **On deposit** vault allocations (first cut from full net)  
3. **Pay split** on remainder → **Savings** / **Checking**  
4. Record ledger lines

## Acceptance criteria

- [ ] Multiple on-deposit vaults cannot exceed 100% at setup
- [ ] **Complete** vault still allows **Manual vault transfer** both directions
- [ ] **Scheduled** transfer skipped with **Transfer skipped notice** (in-app only) when insufficient unallocated **Savings**
- [ ] Pipeline unit tests with fixed **Cents** inputs

## Domain refs

- **Pay split**, **Vault**, **Vault setup**, **Paycheck pipeline**, **On deposit allocation**, **Recurring vault transfer**, **Goal reached**, **Close vault**, **Manual vault transfer**, **Common vault goal**

## Out of scope

- Real pay run (slice 6)
- **Transfer reason** / peer transfer (slice 9)
