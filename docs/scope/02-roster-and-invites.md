# Slice 2 — Roster & invites

## Goal

Invitation-only onboarding: teachers invite students and co-teachers; neutral accept flow; roster with pending state; pay tokens for ID cards.

## Dependencies

- Slice 1 (tenants, authz, classroom seed)

## Deliverables

- **Invitation** mutations: student (email + **External student identifier** + **Grade** 7|8), co-teacher
- **Resend invitation** / **Revoke invitation**; **expire after 14 days**
- Client: `/invite/:id` → Google sign-in (domain `@ofy.org`) → accept → redirect **Sign-in surface** or default **Kibble**
- **Pending invitation** on teacher roster; active vs pending states
- **Pay token** created on invite **send**; **Rotate pay token** in teacher admin
- Provision empty **Checking** + **Savings** on invite send (not on accept)
- Resend email templates (invite) — wire in slice 10 if templates not ready here

## Acceptance criteria

- [ ] Non-matching email cannot accept invite
- [ ] Expired invite cannot accept; teacher can resend
- [ ] Revoked invite link dead
- [ ] **POS** rejects token for pending (not active) students
- [ ] Co-teacher invite grants equal **Teacher** role

## Domain refs

- **Invitation**, **Pending invitation**, **Pay token**, **Rotate pay token**, **External student identifier**, **Grade**

## Out of scope

- Pay run, vaults, pay split wizard
- Student guided tour (slice 11)
