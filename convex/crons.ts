import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'

const crons = cronJobs()

// Early morning UTC — fund due scheduled vaults from unallocated savings.
crons.cron(
  'scheduled vault funding',
  '0 6 * * *',
  internal.features.vaultsCron.processScheduledVaultFunding,
  {}
)

// Every hour at :30 UTC; handler no-ops unless product clock is 8:30 AM PT
// (covers PST=16:30 UTC and PDT=15:30 UTC without dual crons).
crons.cron(
  'payday automation',
  '30 * * * *',
  internal.features.payrollCron.processPaydayAutomationCron,
  {}
)

export default crons
