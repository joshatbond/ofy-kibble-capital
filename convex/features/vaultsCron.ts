import { v } from 'convex/values'

import { internalMutation } from '../_generated/server'
import { processDueScheduledVaults } from './vaults/scheduledFunding'

/** Daily cron entrypoint — funds due scheduled vaults from unallocated savings. */
export const processScheduledVaultFunding = internalMutation({
  args: {
    /** Optional clock override for tests; defaults to Date.now(). */
    nowMs: v.optional(v.number()),
  },
  returns: v.object({
    funded: v.number(),
    skipped: v.number(),
    examined: v.number(),
  }),
  handler: async (ctx, args) => {
    return await processDueScheduledVaults(ctx, {
      nowMs: args.nowMs ?? Date.now(),
    })
  },
})
