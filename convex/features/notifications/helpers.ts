import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'

/** Emit in-app Transfer skipped notice when a scheduled vault transfer cannot run. */
export async function insertTransferSkippedNotification(
  ctx: MutationCtx,
  args: {
    roster: Doc<'rosterStudents'>
    vault: Doc<'vaults'>
    amountCents: number
    nowMs: number
  }
): Promise<Id<'notifications'> | null> {
  if (args.roster.userId === undefined) {
    return null
  }

  return await ctx.db.insert('notifications', {
    userId: args.roster.userId,
    rosterStudentId: args.roster._id,
    kind: 'transfer_skipped',
    title: 'Transfer skipped',
    body: `Not enough unallocated savings to fund ${args.vault.name} (${args.amountCents}¢).`,
    createdAt: args.nowMs,
    vaultId: args.vault._id,
  })
}
