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
      if (keepGood === undefined) {
        throw new Error('expected schoolSiteSettings')
      }

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

  test('repairs region, school-site, and classroom schedules in one batch and is idempotent', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)

    const badSchedule = {
      type: 'biweekly' as const,
      weekday: 5,
      firstPayDate: '2025-07-15',
    }
    const validWeekly = {
      type: 'weekly' as const,
      weekday: 1,
    }

    const before = await t.run(async ctx => {
      const regionRows = await ctx.db.query('regionSettings').collect()
      const siteRows = await ctx.db.query('schoolSiteSettings').collect()
      const classRow = await ctx.db
        .query('classSettings')
        .withIndex('by_organizationId', q =>
          q.eq('organizationId', organizationId)
        )
        .unique()

      const region = regionRows[0]
      const badSite = siteRows[0]
      if (region === undefined || badSite === undefined || classRow === null) {
        throw new Error('expected seeded region, site, and class settings')
      }

      // Extra site row holds a valid non-canonical schedule that must not be overwritten.
      const schoolSiteId = await ctx.db.insert('schoolSites', {
        siteSlug: 'repair-keep-weekly',
        name: 'Repair Keep Weekly',
        regionId: region.regionId,
      })
      const keepValidSiteId = await ctx.db.insert('schoolSiteSettings', {
        schoolSiteId,
        ...V1_BASE_SETTINGS,
        paySchedule: validWeekly,
      })

      await ctx.db.patch('regionSettings', region._id, {
        paySchedule: badSchedule,
      })
      await ctx.db.patch('schoolSiteSettings', badSite._id, {
        paySchedule: badSchedule,
      })
      await ctx.db.patch('classSettings', classRow._id, {
        paySchedule: badSchedule,
      })

      return {
        regionId: region._id,
        badSiteId: badSite._id,
        keepValidSiteId,
        classId: classRow._id,
      }
    })

    const first = await t.run(async ctx => {
      return await repairInconsistentPaySchedules(ctx)
    })
    expect(first.patched).toBe(3)

    const after = await t.run(async ctx => {
      return {
        region: await ctx.db.get('regionSettings', before.regionId),
        badSite: await ctx.db.get('schoolSiteSettings', before.badSiteId),
        keepValid: await ctx.db.get(
          'schoolSiteSettings',
          before.keepValidSiteId
        ),
        classRow: await ctx.db.get('classSettings', before.classId),
      }
    })

    expect(after.region?.paySchedule).toEqual(V1_BASE_SETTINGS.paySchedule)
    expect(after.badSite?.paySchedule).toEqual(V1_BASE_SETTINGS.paySchedule)
    expect(after.classRow?.paySchedule).toEqual(V1_BASE_SETTINGS.paySchedule)
    expect(after.keepValid?.paySchedule).toEqual(validWeekly)

    const second = await t.mutation(internal.seed.index.repairPaySchedules, {})
    expect(second.patched).toBe(0)
  })
})
