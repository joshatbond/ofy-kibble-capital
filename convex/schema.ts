import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

import { studentAppValidator } from './lib/studentApp'

export default defineSchema({
  ...authTables,
  authSessions: defineTable({
    userId: v.id('users'),
    expirationTime: v.number(),
    /** Which student app this session was opened from (set at OAuth sign-in). */
    studentApp: v.optional(studentAppValidator),
  }).index('userId', ['userId']),
  studentOAuthIntents: defineTable({
    verifierId: v.id('authVerifiers'),
    studentApp: studentAppValidator,
    expirationTime: v.number(),
  }).index('by_verifier', ['verifierId']),
  numbers: defineTable({
    value: v.number(),
  }),
})
