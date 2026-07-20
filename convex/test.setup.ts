/// <reference types="vite/client" />
import authzTest from '@djpanda/convex-authz/test'
import tenantsTest from '@djpanda/convex-tenants/test'
import { convexTest } from 'convex-test'

import { internal } from './_generated/api'
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

/** Idempotent v1 region / sites / settings / dev classroom bootstrap. */
export async function seedV1Catalog(t: ConvexTest) {
  return await t.mutation(internal.seed.index.seedV1Catalog, {})
}

/**
 * Seed the v1 catalog and link a signed-in teacher into the dev classroom.
 * Default role is `teacher` (has invitations:create).
 */
export async function setupDevTeacherClassroom(
  t: ConvexTest,
  options: {
    email?: string
    name?: string
    role?: 'owner' | 'admin' | 'teacher'
  } = {}
) {
  const email = options.email ?? 'teacher@ofy.org'
  const seeded = await seedV1Catalog(t)
  const teacher = await asAuthedUser(t, {
    email,
    name: options.name ?? 'Dev Teacher',
  })

  const linked = await t.mutation(internal.seed.index.linkDevTeacherByEmail, {
    email,
    role: options.role ?? 'teacher',
  })

  return {
    ...seeded,
    teacher,
    organizationId: linked.organizationId,
  }
}
