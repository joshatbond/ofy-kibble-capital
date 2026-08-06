import { afterEach, describe, expect, test, vi } from 'vitest'

import { internal } from '../_generated/api'
import { V1_BASE_SETTINGS } from '../features/settings/defaults'
import { initConvexTest, setupDevTeacherClassroom } from '../test.setup'

import {
  isLegacyBiweeklyWeekdayMismatch,
  repairInconsistentPaySchedules,
  repairInconsistentPaySchedulesBatch,
} from './catalogSettings'

afterEach(() => {
  vi.useRealTimers()
})

const legacyBadBiweekly = {
  type: 'biweekly' as const,
  weekday: 5,
  firstPayDate: '2025-07-15',
}

const validWeekly = {
  type: 'weekly' as const,
  weekday: 1,
}

describe('isLegacyBiweeklyWeekdayMismatch', () => {
  test('detects biweekly firstPayDate/weekday mismatch only', () => {
    expect(isLegacyBiweeklyWeekdayMismatch(legacyBadBiweekly)).toBe(true)
    expect(isLegacyBiweeklyWeekdayMismatch(V1_BASE_SETTINGS.paySchedule)).toBe(
      false
    )
    expect(isLegacyBiweeklyWeekdayMismatch(validWeekly)).toBe(false)
    expect(
      isLegacyBiweeklyWeekdayMismatch({
        type: 'monthly',
        dayOfMonth: 0,
      })
    ).toBe(false)
  })
})

describe('repairInconsistentPaySchedules', () => {
  test('patches legacy biweekly mismatches and leaves valid ones alone', async () => {
    vi.useFakeTimers()
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
      expect(siteRows.length).toBeGreaterThan(0)
      const keepGood = siteRows[0]

      await ctx.db.patch('classSettings', classRow._id, {
        paySchedule: legacyBadBiweekly,
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
    expect(viaHelper.done).toBe(true)

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
    // One invocation covers a single table page; continuation advances tables.
    await t.finishAllScheduledFunctions(vi.runAllTimers)
  })

  test('does not replace non-legacy invalid schedules with V1 defaults', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)

    const invalidMonthly = { type: 'monthly' as const, dayOfMonth: 0 }

    const classId = await t.run(async ctx => {
      const classRow = await ctx.db
        .query('classSettings')
        .withIndex('by_organizationId', q =>
          q.eq('organizationId', organizationId)
        )
        .unique()
      if (classRow === null) {
        throw new Error('expected classSettings')
      }
      await ctx.db.patch('classSettings', classRow._id, {
        paySchedule: invalidMonthly,
      })
      return classRow._id
    })

    const result = await t.run(async ctx => {
      return await repairInconsistentPaySchedules(ctx)
    })
    expect(result.patched).toBe(0)

    const after = await t.run(async ctx => {
      return await ctx.db.get('classSettings', classId)
    })
    expect(after?.paySchedule).toEqual(invalidMonthly)
  })

  test('repairs region, school-site, and classroom legacy schedules and is idempotent', async () => {
    vi.useFakeTimers()
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)

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
      expect(region).toBeDefined()
      expect(badSite).toBeDefined()
      if (classRow === null) {
        throw new Error('expected classSettings')
      }

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
        paySchedule: legacyBadBiweekly,
      })
      await ctx.db.patch('schoolSiteSettings', badSite._id, {
        paySchedule: legacyBadBiweekly,
      })
      await ctx.db.patch('classSettings', classRow._id, {
        paySchedule: legacyBadBiweekly,
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
    expect(first.done).toBe(true)

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
    await t.finishAllScheduledFunctions(vi.runAllTimers)
  })

  test('processes bounded batches and continues via scheduled internal mutation', async () => {
    vi.useFakeTimers()
    const t = initConvexTest()
    await setupDevTeacherClassroom(t)

    await t.run(async ctx => {
      const region = await ctx.db.query('regionSettings').first()
      if (region === null) {
        throw new Error('expected regionSettings')
      }
      for (let i = 0; i < 15; i += 1) {
        const schoolSiteId = await ctx.db.insert('schoolSites', {
          siteSlug: `repair-batch-${String(i)}`,
          name: `Repair Batch ${String(i)}`,
          regionId: region.regionId,
        })
        await ctx.db.insert('schoolSiteSettings', {
          schoolSiteId,
          ...V1_BASE_SETTINGS,
          paySchedule: legacyBadBiweekly,
        })
      }
    })

    const first = await t.mutation(internal.seed.index.repairPaySchedules, {
      batchSize: 5,
    })
    expect(first.done).toBe(false)
    expect(first.examined).toBeLessThanOrEqual(5)
    expect(first.continueCursor).not.toBeNull()

    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const remainingBad = await t.run(async ctx => {
      const sites = await ctx.db.query('schoolSiteSettings').collect()
      return sites.filter(row =>
        isLegacyBiweeklyWeekdayMismatch(row.paySchedule)
      ).length
    })
    expect(remainingBad).toBe(0)
  })

  test('seedV1Catalog runs repair as part of bootstrap', async () => {
    const t = initConvexTest()
    const seeded = await t.mutation(internal.seed.index.seedV1Catalog, {})
    expect(seeded.payScheduleRepair).toEqual({
      patched: 0,
      done: true,
    })
  })
})

describe('repairInconsistentPaySchedulesBatch', () => {
  test('returns continue cursor when batch size is exhausted mid-table', async () => {
    const t = initConvexTest()
    await setupDevTeacherClassroom(t)

    await t.run(async ctx => {
      const region = await ctx.db.query('regionSettings').first()
      if (region === null) {
        throw new Error('expected regionSettings')
      }
      for (let i = 0; i < 5; i += 1) {
        const schoolSiteId = await ctx.db.insert('schoolSites', {
          siteSlug: `repair-cursor-${String(i)}`,
          name: `Repair Cursor ${String(i)}`,
          regionId: region.regionId,
        })
        await ctx.db.insert('schoolSiteSettings', {
          schoolSiteId,
          ...V1_BASE_SETTINGS,
          paySchedule: legacyBadBiweekly,
        })
      }
    })

    const first = await t.run(async ctx => {
      return await repairInconsistentPaySchedulesBatch(ctx, {
        cursor: { table: 'schoolSiteSettings', tableCursor: null },
        batchSize: 2,
      })
    })
    expect(first.done).toBe(false)
    expect(first.examined).toBe(2)
    expect(first.continueCursor?.table).toBe('schoolSiteSettings')
    expect(first.continueCursor?.tableCursor).not.toBeNull()

    let cursor = first.continueCursor
    for (let i = 0; i < 20 && cursor !== null; i += 1) {
      const next = await t.run(async ctx => {
        return await repairInconsistentPaySchedulesBatch(ctx, {
          cursor,
          batchSize: 100,
        })
      })
      if (next.done) {
        cursor = null
        break
      }
      cursor = next.continueCursor
    }
    expect(cursor).toBeNull()
  })
})
