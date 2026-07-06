import { v } from 'convex/values'

import { internal } from '../../_generated/api'
import {
  internalAction,
  internalMutation,
  internalQuery,
} from '../../_generated/server'

const backfillResultValidator = v.object({
  scheduled: v.number(),
})

export const getUserImage = internalQuery({
  args: { userId: v.id('users') },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get('users', args.userId)
    return user?.image ?? null
  },
})

export const applyProfileImageUrl = internalMutation({
  args: {
    userId: v.id('users'),
    imageUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get('users', args.userId)
    if (user === null) {
      return null
    }

    if (user.image === args.imageUrl) {
      return null
    }

    await ctx.db.patch('users', args.userId, { image: args.imageUrl })

    return null
  },
})

export const syncProfileImageFromUrl = internalAction({
  args: {
    userId: v.id('users'),
    sourceUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!args.sourceUrl.includes('googleusercontent.com')) {
      return null
    }

    const existingImage = await ctx.runQuery(
      internal.features.users.profileImage.getUserImage,
      { userId: args.userId }
    )

    if (
      existingImage !== null &&
      !existingImage.includes('googleusercontent.com')
    ) {
      return null
    }

    const response = await fetch(args.sourceUrl, {
      headers: {
        Accept: 'image/*',
      },
    })

    if (!response.ok) {
      console.error('Profile image fetch failed', {
        userId: args.userId,
        status: response.status,
      })
      return null
    }

    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      console.error('Profile image fetch returned non-image content', {
        userId: args.userId,
        contentType,
      })
      return null
    }

    const bytes = await response.arrayBuffer()
    const storageId = await ctx.storage.store(
      new Blob([bytes], { type: contentType })
    )
    const imageUrl = await ctx.storage.getUrl(storageId)

    if (imageUrl === null) {
      return null
    }

    await ctx.runMutation(
      internal.features.users.profileImage.applyProfileImageUrl,
      {
        userId: args.userId,
        imageUrl,
      }
    )

    return null
  },
})

export const backfillGoogleProfileImages = internalMutation({
  args: {},
  returns: backfillResultValidator,
  handler: async ctx => {
    const users = await ctx.db.query('users').collect()
    let scheduled = 0

    for (const user of users) {
      if (
        user.image === undefined ||
        !user.image.includes('googleusercontent.com')
      ) {
        continue
      }

      await ctx.scheduler.runAfter(
        0,
        internal.features.users.profileImage.syncProfileImageFromUrl,
        {
          userId: user._id,
          sourceUrl: user.image,
        }
      )
      scheduled++
    }

    return { scheduled }
  },
})
