import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'

export type NotificationPublic = {
  _id: Id<'notifications'>
  kind: Doc<'notifications'>['kind']
  title: string
  body: string
  readAt?: number
  createdAt: number
  vaultId?: Id<'vaults'>
}

export function toNotificationPublic(
  notification: Doc<'notifications'>
): NotificationPublic {
  return {
    _id: notification._id,
    kind: notification.kind,
    title: notification.title,
    body: notification.body,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    vaultId: notification.vaultId,
  }
}

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

export async function listUnreadNotificationsForUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  limit = 50
): Promise<Doc<'notifications'>[]> {
  // Unread rows omit readAt; indexed equality on undefined matches omitted field.
  return await ctx.db
    .query('notifications')
    .withIndex('by_user_readAt_createdAt', q =>
      q.eq('userId', userId).eq('readAt', undefined)
    )
    .order('desc')
    .take(limit)
}

export async function markNotificationReadForUser(
  ctx: MutationCtx,
  args: {
    notificationId: Id<'notifications'>
    userId: Id<'users'>
    nowMs: number
  }
): Promise<Doc<'notifications'> | null> {
  const notification = await ctx.db.get('notifications', args.notificationId)
  if (notification === null || notification.userId !== args.userId) {
    return null
  }
  if (notification.readAt !== undefined) {
    return notification
  }

  await ctx.db.patch('notifications', notification._id, {
    readAt: args.nowMs,
  })

  return await ctx.db.get('notifications', notification._id)
}

export async function markAllNotificationsReadForUser(
  ctx: MutationCtx,
  args: {
    userId: Id<'users'>
    nowMs: number
  }
): Promise<number> {
  const unread = await listUnreadNotificationsForUser(ctx, args.userId, 100)
  for (const notification of unread) {
    await ctx.db.patch('notifications', notification._id, {
      readAt: args.nowMs,
    })
  }
  return unread.length
}
