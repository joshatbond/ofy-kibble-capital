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

export default crons
