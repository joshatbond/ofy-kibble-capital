# App structure

## User flow

1. User visits the website
2. Loading screen is displayed (like an app, full screen, app dependent)
3. While loading, the app checks if the user is authenticated/authorized
4. If the user is authenticated/authorized, they are redirected to the appropriate app
5. If the user is not authenticated/authorized, they are redirected to the landing page for the app they are trying to access

## Routes

- `/` -> `/kibble`
  - Main route automatically redirects to `/kibble`

- `/admin`
  - Main route dashboard
- `/admin/landing`
- `/admin/[orgId]`
- `/admin/[orgId]/[classId]`
- `/admin/[orgId]/[classId]/store`
- `/admin/[orgId]/[classId]/pos`

- `/kibble`
  - Main route dashboard, shows an overview of recent activity
- `/kibble/landing`
  - Landing page for the app, unauthenticated "marketing" page
- `/kibble/time`
  - Time tracking page
    - Shows current status (clocked in/out)
    - Calendar view of entries for the pay period
    - "Quick actions"
      - Clock in/out
      - Request time off
- `/kibble/pay`
  - Pay stub list page
    - Most recent paystub prominently featured
    - "History" view with 10 most recent paystubs (paginated)
- `/kibble/pay/[id]`
  - Pay stub detail page
    - Shows the paystub breakdown (gross, pre-tax, post-tax)
- `/kibble/absence`
  - Absence request list page
    - Shows PTO balance
    - Shows PTO history
    - Absence request form to request time off
- `/kibble/absence/[id]`
  - Absence request detail page
    - Shows the absence request details
    - if the absence request is pending, shows a button to cancel/edit the request
    -
- `/pawket`
  - Main route dashboard, shows an overview of all balances and recent activity
- `/pawket/landing`
  - Landing page for the app, unauthenticated "marketing" page
- `/pawket/checking`
  - Checking account dashboard
- `/pawket/checking/[transactionId]`
  - Checking account transaction detail page
- `/pawket/savings`
  - Savings account dashboard (includes entry to vaults)
- `/pawket/savings/[transactionId]`
  - Savings account transaction detail page
- `/pawket/savings/vaults`
  - Vaults list (specialized savings accounts)
- `/pawket/savings/vaults/[vaultId]`
  - Vault detail page
- `/pawket/savings/vaults/[vaultId]/transactions`
  - Vault transactions list page
- `/pawket/savings/vaults/[vaultId]/transactions/[transactionId]`
  - Vault transaction detail page
- `/pawket/transfer`
  - Transfer between checking and savings
- `/pawket/transfer/[transactionId]`
  - Transfer detail page
