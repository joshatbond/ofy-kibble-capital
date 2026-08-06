import { describe, expect, test } from 'vitest'

import { internal } from '../_generated/api'
import { V1_BASE_SETTINGS } from '../features/settings/defaults'
import { initConvexTest, setupDevTeacherClassroom } from '../test.setup'

import { repairInconsistentPaySchedules } from './catalogSettings'

describe('repairInconsistentPaySchedules', () => {
  test('patches bad biweekly schedules and leaves valid ones alone', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)

    const before = await t.run(async ctx => {
      const classRow = await ctx.db
        .query('classSettings')
        .withIndex('by_organizationId', q =>
          q.eq('organizationId', organizationId)
        )
        .unique()
      if (classRow === null) {
        throw new Error('expected classSettings')
      }

      const siteRows = await ctx.db.query('schoolSiteSettings').collect()
      const keepGood = siteRows[0]

      await ctx.db.patch('classSettings', classRow._id, {
        paySchedule: {
          type: 'biweekly',
          weekday: 5,
          firstPayDate: '2025-07-15',
        },
      })

      return {
        classId: classRow._id,
        goodSiteId: keepGood._id,
        goodSiteSchedule: keepGood.paySchedule,
      }
    })

    const viaHelper = await t.run(async ctx => {
      return await repairInconsistentPaySchedules(ctx)
    })
    expect(viaHelper.patched).toBe(1)

    const after = await t.run(async ctx => {
      const classRow = await ctx.db.get('classSettings', before.classId)
      const siteRow = await ctx.db.get('schoolSiteSettings', before.goodSiteId)
      return {
        classSchedule: classRow?.paySchedule,
        siteSchedule: siteRow?.paySchedule,
      }
    })

    expect(after.classSchedule).toEqual(V1_BASE_SETTINGS.paySchedule)
    expect(after.siteSchedule).toEqual(before.goodSiteSchedule)

    const second = await t.mutation(internal.seed.index.repairPaySchedules, {})
    expect(second.patched).toBe(0)
  })
})
