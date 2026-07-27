import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'

export async function getPaySplitForStudent(
  ctx: QueryCtx | MutationCtx,
  rosterStudentId: Id<'rosterStudents'>
): Promise<Doc<'paySplits'> | null> {
  return await ctx.db
    .query('paySplits')
    .withIndex('by_rosterStudentId', q =>
      q.eq('rosterStudentId', rosterStudentId)
    )
    .unique()
}

/** Effective pay split: unset → 100% checking. */
export function effectivePaySplitPercents(
  paySplit: Doc<'paySplits'> | null
): { savingsPercent: number; checkingPercent: number } {
  if (paySplit === null) {
    return { savingsPercent: 0, checkingPercent: 100 }
  }

  return {
    savingsPercent: paySplit.savingsPercent,
    checkingPercent: paySplit.checkingPercent,
  }
}

export function assertValidPaySplitPercents(savingsPercent: number): void {
  if (
    !Number.isInteger(savingsPercent) ||
    savingsPercent < 0 ||
    savingsPercent > 100
  ) {
    throw new Error('Savings percent must be an integer from 0 to 100.')
  }
}

export async function upsertPaySplit(
  ctx: MutationCtx,
  args: {
    organizationId: string
    rosterStudentId: Id<'rosterStudents'>
    savingsPercent: number
    updatedAt: number
  }
): Promise<Id<'paySplits'>> {
  assertValidPaySplitPercents(args.savingsPercent)
  const checkingPercent = 100 - args.savingsPercent

  const existing = await getPaySplitForStudent(ctx, args.rosterStudentId)
  if (existing !== null) {
    await ctx.db.patch('paySplits', existing._id, {
      savingsPercent: args.savingsPercent,
      checkingPercent,
      updatedAt: args.updatedAt,
    })
    return existing._id
  }

  return await ctx.db.insert('paySplits', {
    organizationId: args.organizationId,
    rosterStudentId: args.rosterStudentId,
    savingsPercent: args.savingsPercent,
    checkingPercent,
    updatedAt: args.updatedAt,
  })
}
