import { Migrations } from '@convex-dev/migrations'
import { v } from 'convex/values'

import { components, internal } from './_generated/api'
import { internalMutation } from './_generated/server'
import { computePayRunDenormalizedTotals } from './features/payroll/payRunTotals'

import type { DataModel } from './_generated/dataModel'

const migrations = new Migrations<DataModel>(components.migrations, {
  internalMutation,
})

/**
 * Backfill `totalFundsCents` / `stubCount` on payRuns that predate those fields.
 * Run after deploying the optional schema widen; then narrow to required.
 *
 * CLI: `bunx convex run migrations:backfillPayRunTotals`
 */
export const backfillPayRunTotals = migrations.define({
  table: 'payRuns',
  migrateOne: async (ctx, run) => {
    if (run.totalFundsCents !== undefined && run.stubCount !== undefined) {
      return
    }

    const totals = await computePayRunDenormalizedTotals(ctx, run)
    return {
      totalFundsCents: run.totalFundsCents ?? totals.totalFundsCents,
      stubCount: run.stubCount ?? totals.stubCount,
    }
  },
})

/** Programmatic / test entry that runs the backfill to completion. */
export const runBackfillPayRunTotals = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    await migrations.runOne(ctx, internal.migrations.backfillPayRunTotals)
    return null
  },
})
