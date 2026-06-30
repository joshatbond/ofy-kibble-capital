import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { components } from '../../_generated/api'
import { query } from '../../_generated/server'
import { getClassroomByOrganizationId } from '../settings/effectiveSettings'
import { isTeacherMemberRole } from '../tenants/roles'

import type { Id } from '../../_generated/dataModel'
import type { QueryCtx } from '../../_generated/server'

const teacherClassroomContextValidator = v.object({
  organizationId: v.string(),
  organizationName: v.string(),
  classroomId: v.id('classrooms'),
  classroomName: v.string(),
  siteSlug: v.string(),
  orgSlug: v.string(),
  viewerEmail: v.string(),
})

const classroomTeacherValidator = v.object({
  userId: v.id('users'),
  email: v.string(),
  name: v.optional(v.string()),
  role: v.string(),
})

export const getTeacherClassroomContext = query({
  args: {},
  returns: v.union(teacherClassroomContextValidator, v.null()),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const user = await ctx.db.get('users', userId)
    const viewerEmail = user?.email
    if (viewerEmail === undefined) {
      return null
    }

    const teacherOrg = await findFirstTeacherOrganization(ctx, userId)
    if (teacherOrg === null) {
      return null
    }

    const classroom = await getClassroomByOrganizationId(
      ctx,
      teacherOrg.organizationId
    )
    if (classroom === null) {
      return null
    }

    return {
      organizationId: teacherOrg.organizationId,
      organizationName: teacherOrg.organizationName,
      classroomId: classroom._id,
      classroomName: classroom.name,
      siteSlug: classroom.siteSlug,
      orgSlug: classroom.orgSlug,
      viewerEmail,
    }
  },
})

export const listClassroomTeachers = query({
  args: { organizationId: v.string() },
  returns: v.array(classroomTeacherValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const member = await ctx.runQuery(components.tenants.members.getMember, {
      organizationId: args.organizationId,
      userId,
    })

    if (member === null || !isTeacherMemberRole(member.role)) {
      throw new Error('Teacher access required')
    }

    const members = await ctx.runQuery(
      components.tenants.members.listOrganizationMembers,
      { organizationId: args.organizationId }
    )

    const teachers = []

    for (const orgMember of members) {
      if (!isTeacherMemberRole(orgMember.role)) {
        continue
      }

      const user = await ctx.db.get('users', orgMember.userId as Id<'users'>)
      if (user === null || user.email === undefined) {
        continue
      }

      teachers.push({
        userId: user._id,
        email: user.email,
        name: user.name,
        role: orgMember.role,
      })
    }

    teachers.sort((a, b) => a.email.localeCompare(b.email))

    return teachers
  },
})

async function findFirstTeacherOrganization(
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<{ organizationId: string; organizationName: string } | null> {
  const classrooms = await ctx.db.query('classrooms').collect()

  for (const classroom of classrooms) {
    const member = await ctx.runQuery(components.tenants.members.getMember, {
      organizationId: classroom.organizationId,
      userId,
    })

    if (member === null || !isTeacherMemberRole(member.role)) {
      continue
    }

    const organization = await ctx.runQuery(
      components.tenants.organizations.getOrganization,
      { organizationId: classroom.organizationId }
    )

    return {
      organizationId: classroom.organizationId,
      organizationName: organization?.name ?? classroom.name,
    }
  }

  return null
}
