import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import { notificationKindValidator } from '../schema/schemaFields'
import {
  listUnreadNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
  toNotificationPublic,
} from './notifications/helpers'

const notificationPublicValidator = v.object({
  _id: v.id('notifications'),
  kind: notificationKindValidator,
  title: v.string(),
  body: v.string(),
  readAt: v.optional(v.number()),
  createdAt: v.number(),
  vaultId: v.optional(v.id('vaults')),
})

export const listMyUnreadNotifications = query({
  args: {},
  returns: v.array(notificationPublicValidator),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const unread = await listUnreadNotificationsForUser(ctx, userId)
    return unread.map(toNotificationPublic)
  },
})

export const unreadNotificationCount = query({
  args: {},
  returns: v.number(),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const unread = await listUnreadNotificationsForUser(ctx, userId)
    return unread.length
  },
})

export const markNotificationRead = mutation({
  args: { notificationId: v.id('notifications') },
  returns: v.union(notificationPublicValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const updated = await markNotificationReadForUser(ctx, {
      notificationId: args.notificationId,
      userId,
      nowMs: Date.now(),
    })
    return updated === null ? null : toNotificationPublic(updated)
  },
})

export const markAllNotificationsRead = mutation({
  args: {},
  returns: v.object({ markedCount: v.number() }),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const markedCount = await markAllNotificationsReadForUser(ctx, {
      userId,
      nowMs: Date.now(),
    })
    return { markedCount }
  },
})
