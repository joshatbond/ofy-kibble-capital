import type { Doc } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'

/**
 * Derive denormalized pay-run totals from stubs (succeeded) or zeros otherwise.
 * Used by posting writers and the payRuns backfill migration.
 */
export async function computePayRunDenormalizedTotals(
  ctx: QueryCtx | MutationCtx,
  payRun: Doc<'payRuns'>
): Promise<{ totalFundsCents: number; stubCount: number }> {
  if (payRun.status !== 'succeeded') {
    return { totalFundsCents: 0, stubCount: 0 }
  }

  const stubs = await ctx.db
    .query('paystubs')
    .withIndex('by_payRunId', q => q.eq('payRunId', payRun._id))
    .collect()

  let totalFundsCents = 0
  for (const stub of stubs) {
    totalFundsCents += stub.netPayCents
  }

  return {
    totalFundsCents,
    stubCount: stubs.length,
  }
}
