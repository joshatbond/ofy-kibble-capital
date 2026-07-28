import { v } from 'convex/values'

import { internalMutation } from '../_generated/server'

import { processPaydayAutomation } from './payroll/paydayAutomation'

/** Cron entrypoint — **Payday automation** at 8:30 AM product timezone. */
export const processPaydayAutomationCron = internalMutation({
  args: {
    /** Optional clock override for tests; defaults to Date.now(). */
    nowMs: v.optional(v.number()),
  },
  returns: v.object({
    examinedClassrooms: v.number(),
    attempted: v.number(),
    succeeded: v.number(),
    blocked: v.number(),
    skipped: v.number(),
    outsidePayRunTime: v.boolean(),
  }),
  handler: async (ctx, args) => {
    return await processPaydayAutomation(ctx, {
      nowMs: args.nowMs ?? Date.now(),
    })
  },
})
