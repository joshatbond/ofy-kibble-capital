import { v } from 'convex/values'

import { components } from '../../_generated/api'
import { internalMutation } from '../../_generated/server'

import { deleteNeverActiveRosterStudent } from './roster'

import type { Doc } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'

const cleanupResultValidator = v.object({
  matched: v.number(),
  removed: v.number(),
  failed: v.number(),
  failures: v.array(v.string()),
})

export const cleanupNeverActiveRosterStudents = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: cleanupResultValidator,
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false
    const rosterRows = await ctx.db.query('rosterStudents').collect()

    let matched = 0
    let removed = 0
    let failed = 0
    const failures: string[] = []

    for (const roster of rosterRows) {
      if (!(await shouldRemoveNeverActiveRoster(ctx, roster))) {
        continue
      }

      matched++

      if (dryRun) {
        continue
      }

      try {
        await deleteNeverActiveRosterStudent(ctx, roster._id)
        removed++
      } catch (error) {
        failed++
        failures.push(
          `${roster._id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return { matched, removed, failed, failures }
  },
})

async function shouldRemoveNeverActiveRoster(
  ctx: MutationCtx,
  roster: Doc<'rosterStudents'>
): Promise<boolean> {
  if (roster.userId !== undefined || roster.status === 'active') {
    return false
  }

  if (roster.status === 'revoked') {
    return true
  }

  const invitation = await ctx.runQuery(
    components.tenants.invitations.getInvitation,
    { invitationId: roster.invitationId }
  )

  return invitation?.status === 'cancelled'
}
