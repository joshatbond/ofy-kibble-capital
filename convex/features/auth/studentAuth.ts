import { getAuthSessionId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { mutation, query } from '../../_generated/server'

import {
  studentAppFromPathname,
  studentAppFromRedirectTo,
  studentAppValidator,
} from './studentApp'

const OAUTH_INTENT_TTL_MS = 1000 * 60 * 15
export const recordOAuthStudentApp = mutation({
  args: {
    verifierId: v.id('authVerifiers'),
    redirectTo: v.string(),
  },
  handler: async (ctx, args) => {
    const studentApp = studentAppFromRedirectTo(args.redirectTo)

    if (studentApp === null) {
      throw new Error('redirectTo must target /kibble or /pawket')
    }

    const verifier = await ctx.db.get('authVerifiers', args.verifierId)

    if (verifier === null) {
      throw new Error('Invalid OAuth verifier')
    }

    const existing = await ctx.db
      .query('studentOAuthIntents')
      .withIndex('by_verifier', q => q.eq('verifierId', args.verifierId))
      .unique()

    if (existing !== null) {
      await ctx.db.delete('studentOAuthIntents', existing._id)
    }

    await ctx.db.insert('studentOAuthIntents', {
      verifierId: args.verifierId,
      studentApp,
      expirationTime: Date.now() + OAUTH_INTENT_TTL_MS,
    })
  },
})
export const applyOAuthStudentApp = mutation({
  args: {
    verifierId: v.optional(v.id('authVerifiers')),
    fallbackRedirectTo: v.optional(v.string()),
    fallbackPathname: v.optional(v.string()),
  },
  returns: v.union(studentAppValidator, v.null()),
  handler: async (ctx, args) => {
    const sessionId = await getAuthSessionId(ctx)

    if (sessionId === null) {
      return null
    }

    const session = await ctx.db.get('authSessions', sessionId)

    if (session === null) {
      return null
    }

    if (session.studentApp !== undefined) {
      return session.studentApp
    }

    let studentApp = null

    if (args.verifierId !== undefined) {
      const verifierId = args.verifierId
      const intent = await ctx.db
        .query('studentOAuthIntents')
        .withIndex('by_verifier', q => q.eq('verifierId', verifierId))
        .unique()

      if (intent !== null && intent.expirationTime >= Date.now()) {
        studentApp = intent.studentApp
        await ctx.db.delete('studentOAuthIntents', intent._id)
      }
    }

    if (studentApp === null) {
      studentApp = studentAppFromFallback(args)
    }

    if (studentApp === null) {
      return null
    }

    await ctx.db.patch('authSessions', sessionId, { studentApp })

    return studentApp
  },
})
export const currentStudentApp = query({
  args: {},
  returns: v.union(studentAppValidator, v.null()),
  handler: async ctx => {
    const sessionId = await getAuthSessionId(ctx)

    if (sessionId === null) {
      return null
    }

    const session = await ctx.db.get('authSessions', sessionId)

    return session?.studentApp ?? null
  },
})
function studentAppFromFallback(args: {
  fallbackRedirectTo?: string
  fallbackPathname?: string
}) {
  if (args.fallbackRedirectTo !== undefined) {
    return studentAppFromRedirectTo(args.fallbackRedirectTo)
  }

  if (args.fallbackPathname !== undefined) {
    return studentAppFromPathname(args.fallbackPathname)
  }

  return null
}
