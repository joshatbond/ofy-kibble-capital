/// <reference types="vite/client" />
import authzTest from '@djpanda/convex-authz/test'
import tenantsTest from '@djpanda/convex-tenants/test'
import { convexTest } from 'convex-test'

import schema from './schema'

import type { Id } from './_generated/dataModel'
import type { StudentApp } from './features/auth/studentApp'
import type { TestConvex } from 'convex-test'

export const modules = import.meta.glob('./**/*.ts')

export type ConvexTest = TestConvex<typeof schema>

/** Fresh in-memory Convex backend with tenants + authz components registered. */
export function initConvexTest() {
  const t = convexTest(schema, modules)
  tenantsTest.register(t, 'tenants')
  authzTest.register(t, 'authz')
  return t
}

/**
 * Convex Auth puts `userId|sessionId` in the JWT `subject`.
 * Seed a user + authSessions row and return a client acting as that session.
 */
export async function asAuthedUser(
  t: ConvexTest,
  options: {
    email?: string
    name?: string
    studentApp?: StudentApp
    canCreateOrganization?: boolean
  } = {}
) {
  const { userId, sessionId } = await t.run(async ctx => {
    const userId = await ctx.db.insert('users', {
      email: options.email ?? 'student@ofy.org',
      name: options.name ?? 'Test Student',
      ...(options.canCreateOrganization === true
        ? { canCreateOrganization: true }
        : {}),
    })
    const sessionId = await ctx.db.insert('authSessions', {
      userId,
      expirationTime: Date.now() + 1000 * 60 * 60,
      ...(options.studentApp !== undefined
        ? { studentApp: options.studentApp }
        : {}),
    })
    return { userId, sessionId }
  })

  return {
    userId: userId as Id<'users'>,
    sessionId: sessionId as Id<'authSessions'>,
    client: t.withIdentity({
      subject: `${userId}|${sessionId}`,
    }),
  }
}
