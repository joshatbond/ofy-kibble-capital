import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { components } from '../../_generated/api'
import { query } from '../../_generated/server'
import { isTeacherMemberRole } from '../tenants/roles'

import type { Id } from '../../_generated/dataModel'
import type { QueryCtx } from '../../_generated/server'

const teacherClassroomRowValidator = v.object({
  organizationId: v.string(),
  organizationName: v.string(),
  classroomId: v.id('classrooms'),
  classroomName: v.string(),
  siteSlug: v.string(),
  orgSlug: v.string(),
})

const teacherClassroomContextValidator = v.object({
  organizationId: v.string(),
  organizationName: v.string(),
  classroomId: v.id('classrooms'),
  classroomName: v.string(),
  siteSlug: v.string(),
  orgSlug: v.string(),
  viewerEmail: v.string(),
  viewerName: v.optional(v.string()),
  viewerImage: v.optional(v.string()),
})

const classroomTeacherValidator = v.object({
  userId: v.id('users'),
  email: v.string(),
  name: v.optional(v.string()),
  role: v.string(),
})

export const listTeacherClassrooms = query({
  args: {},
  returns: v.array(teacherClassroomRowValidator),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    return await listTeacherClassroomsForUser(ctx, userId)
  },
})

export const getTeacherClassroomContext = query({
  args: {
    organizationId: v.optional(v.string()),
    classroomId: v.optional(v.id('classrooms')),
  },
  returns: v.union(teacherClassroomContextValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const user = await ctx.db.get('users', userId)
    if (user === null || user.email === undefined) {
      return null
    }

    const viewerEmail = user.email

    const classrooms = await listTeacherClassroomsForUser(ctx, userId)
    if (classrooms.length === 0) {
      return null
    }

    const selected = resolveTeacherClassroom(classrooms, args)
    if (selected === null) {
      return null
    }

    return {
      ...selected,
      viewerEmail,
      viewerName: user.name,
      viewerImage: user.image,
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

type TeacherClassroomRow = {
  organizationId: string
  organizationName: string
  classroomId: Id<'classrooms'>
  classroomName: string
  siteSlug: string
  orgSlug: string
}

function resolveTeacherClassroom(
  classrooms: TeacherClassroomRow[],
  args: {
    organizationId?: string
    classroomId?: Id<'classrooms'>
  }
): TeacherClassroomRow | null {
  if (args.organizationId === undefined) {
    return classrooms[0] ?? null
  }

  const matches = classrooms.filter(
    classroom => classroom.organizationId === args.organizationId
  )

  if (matches.length === 0) {
    return null
  }

  if (args.classroomId === undefined) {
    return matches[0] ?? null
  }

  return (
    matches.find(classroom => classroom.classroomId === args.classroomId) ??
    null
  )
}

async function listTeacherClassroomsForUser(
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<TeacherClassroomRow[]> {
  const classrooms = await ctx.db.query('classrooms').collect()
  const teacherClassrooms: TeacherClassroomRow[] = []

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

    teacherClassrooms.push({
      organizationId: classroom.organizationId,
      organizationName: organization?.name ?? classroom.name,
      classroomId: classroom._id,
      classroomName: classroom.name,
      siteSlug: classroom.siteSlug,
      orgSlug: classroom.orgSlug,
    })
  }

  teacherClassrooms.sort((a, b) => {
    const orgCompare = a.organizationName.localeCompare(b.organizationName)
    if (orgCompare !== 0) {
      return orgCompare
    }

    return a.classroomName.localeCompare(b.classroomName)
  })

  return teacherClassrooms
}
