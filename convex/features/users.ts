import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import { normalizeDisplayName } from '../lib/displayName'

const viewerProfileValidator = v.object({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  image: v.optional(v.string()),
})

/** Current signed-in user id, or null when unauthenticated. */
export const viewer = query({
  args: {},
  handler: async ctx => {
    return await getAuthUserId(ctx)
  },
})

/** Profile fields for the signed-in user. */
export const viewerProfile = query({
  args: {},
  returns: v.union(viewerProfileValidator, v.null()),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }

    const user = await ctx.db.get('users', userId)
    if (user === null) {
      return null
    }

    return {
      name: user.name,
      email: user.email,
      image: user.image,
    }
  },
})

/** Update the signed-in user's display name (overrides OAuth on next manual edit). */
export const updateViewerProfile = mutation({
  args: {
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const name = normalizeDisplayName(args.name)
    await ctx.db.patch('users', userId, { name })

    return null
  },
})
