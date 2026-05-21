# Slice 10 — Notifications

## Goal

Resend **Email alert** + PWA push matrix; permission prompts on install.

## Dependencies

- Slices that emit events (2, 6, 7, 8, 9)

## Deliverables

### Resend

- Templates: invite, **Payday notice**, **PTO pending** (teacher), optional digest
- Env: Resend API key per deployment

### PWA

- Service worker + push subscription per origin/app scope
- Permission UX on first open (teacher admin / PawKet / Kibble as needed)

### Event matrix

| Event | Channel |
|--------|---------|
| **Payday notice** | Teacher: PWA + **Email alert** |
| **Paycheck notification** | Student PawKet: PWA |
| **PTO pending notification** | Teacher: PWA + email + admin UI |
| **PTO decision notification** | Student Kibble: PWA +/or **In-app badge** (no icon badge) |
| New **Posted paystub** | Student Kibble: **In-app badge** only |
| **Peer transfer** received | Student PawKet: PWA |
| **POS** purchase | Student PawKet: PWA |
| **Recurring vault transfer** skipped | Student PawKet: in-app only |
| **Transfer skipped notice** | (no push) |

## Acceptance criteria

- [ ] Email only sends to roster emails on file
- [ ] Push failures do not block pay run or POS
- [ ] Kibble paystub does not set home-screen icon badge count

## Domain refs

- **PWA notification**, **Email alert**, **In-app badge**, all `*notification*` terms in CONTEXT

## Out of scope

- Student email for paycheck
- SMS
