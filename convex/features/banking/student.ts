import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'

export async function getActiveRosterStudentForUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<Doc<'rosterStudents'> | null> {
  const roster = await ctx.db
    .query('rosterStudents')
    .withIndex('by_userId', q => q.eq('userId', userId))
    .unique()

  if (roster === null || roster.status !== 'active') {
    return null
  }

  return roster
}
