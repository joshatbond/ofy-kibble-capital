import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import { requireTeacherForOrg } from './auth/teacher'
import { getActiveRosterStudentForUser } from './banking/student'
import {
  effectivePaySplitPercents,
  getPaySplitForStudent,
  upsertPaySplit,
} from './paySplit/helpers'

const paySplitValidator = v.object({
  savingsPercent: v.number(),
  checkingPercent: v.number(),
  isConfigured: v.boolean(),
  updatedAt: v.union(v.number(), v.null()),
})

const classroomPaySplitRowValidator = v.object({
  rosterStudentId: v.id('rosterStudents'),
  studentDisplayName: v.string(),
  savingsPercent: v.number(),
  checkingPercent: v.number(),
  isConfigured: v.boolean(),
})

export const getMyPaySplit = query({
  args: {},
  returns: v.union(paySplitValidator, v.null()),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      return null
    }

    const paySplit = await getPaySplitForStudent(ctx, roster._id)
    const percents = effectivePaySplitPercents(paySplit)

    return {
      ...percents,
      isConfigured: paySplit !== null,
      updatedAt: paySplit?.updatedAt ?? null,
    }
  },
})

export const setMyPaySplit = mutation({
  args: { savingsPercent: v.number() },
  returns: paySplitValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      throw new Error('Active student account required.')
    }

    const updatedAt = Date.now()
    await upsertPaySplit(ctx, {
      organizationId: roster.organizationId,
      rosterStudentId: roster._id,
      savingsPercent: args.savingsPercent,
      updatedAt,
    })

    return {
      savingsPercent: args.savingsPercent,
      checkingPercent: 100 - args.savingsPercent,
      isConfigured: true,
      updatedAt,
    }
  },
})

export const listClassroomPaySplits = query({
  args: { organizationId: v.string() },
  returns: v.array(classroomPaySplitRowValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    await requireTeacherForOrg(ctx, userId, args.organizationId, 'members:list')

    const rosterStudents = await ctx.db
      .query('rosterStudents')
      .withIndex('by_organizationId', q =>
        q.eq('organizationId', args.organizationId)
      )
      .collect()

    const rows = await Promise.all(
      rosterStudents.map(async roster => {
        const paySplit = await getPaySplitForStudent(ctx, roster._id)
        const percents = effectivePaySplitPercents(paySplit)
        return {
          rosterStudentId: roster._id,
          studentDisplayName: roster.displayName ?? roster.email,
          savingsPercent: percents.savingsPercent,
          checkingPercent: percents.checkingPercent,
          isConfigured: paySplit !== null,
        }
      })
    )

    return rows.sort((a, b) =>
      a.studentDisplayName.localeCompare(b.studentDisplayName)
    )
  },
})
