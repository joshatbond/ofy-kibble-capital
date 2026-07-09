import { orgScope } from '@djpanda/convex-tenants'
import { v } from 'convex/values'

import { components } from '../_generated/api'
import { internalMutation } from '../_generated/server'
import { authz } from '../features/auth/authz'

import { applyV1Catalog, ensureOperatorUser } from './catalog'
import { V1_DEV_CLASSROOM } from './catalogData'

const seedResultValidator = v.object({
  operatorUserId: v.id('users'),
  regionId: v.id('regions'),
  schoolSiteIds: v.record(v.string(), v.id('schoolSites')),
  classroom: v.object({
    organizationId: v.string(),
    classroomId: v.id('classrooms'),
  }),
})
const devTeacherRoleValidator = v.union(
  v.literal('owner'),
  v.literal('admin'),
  v.literal('teacher')
)
export const seedV1Catalog = internalMutation({
  args: {},
  returns: seedResultValidator,
  handler: async ctx => {
    return await applyV1Catalog(ctx)
  },
})
export const linkDevTeacherByEmail = internalMutation({
  args: {
    email: v.string(),
    role: v.optional(devTeacherRoleValidator),
  },
  returns: v.object({
    organizationId: v.string(),
    userId: v.id('users'),
    role: devTeacherRoleValidator,
  }),
  handler: async (ctx, args) => {
    const classroom = await ctx.db
      .query('classrooms')
      .withIndex('by_orgSlug', q => q.eq('orgSlug', V1_DEV_CLASSROOM.orgSlug))
      .unique()

    if (!classroom) {
      throw new Error(
        'Dev classroom is missing — run `bunx convex run seed/index:seedV1Catalog` first.'
      )
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', args.email))
      .unique()

    if (!user) {
      throw new Error(
        `No users row for "${args.email}". Sign in once at /admin/landing, then rerun.`
      )
    }

    const operatorUserId = await ensureOperatorUser(ctx)
    const organizationId = classroom.organizationId
    const role = args.role ?? 'owner'

    const existing = await ctx.runQuery(components.tenants.members.getMember, {
      organizationId,
      userId: user._id,
    })

    if (!existing) {
      await ctx.runMutation(components.tenants.members.addMember, {
        userId: operatorUserId,
        organizationId,
        memberUserId: user._id,
        role,
      })
    }

    await authz.assignRole(
      ctx,
      user._id,
      role,
      orgScope(organizationId),
      undefined,
      operatorUserId
    )

    return { organizationId, userId: user._id, role }
  },
})
