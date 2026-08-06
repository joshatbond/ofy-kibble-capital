import { ConvexError } from 'convex/values'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { api, internal } from '../../_generated/api'
import { initConvexTest, setupDevTeacherClassroom } from '../../test.setup'

afterEach(() => {
  vi.useRealTimers()
})

describe('ensureCurrentPayPeriod', () => {
  test('creates the biweekly period for the next payday and is idempotent', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    // Seeded defaults: biweekly Tuesday from 2026-07-14.
    const nowMs = Date.UTC(2026, 6, 14, 15, 0, 0)
    const first = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs }
    )

    expect(first).toMatchObject({
      organizationId,
      startDate: '2026-06-29',
      endDate: '2026-07-12',
      payDate: '2026-07-14',
      scheduleType: 'biweekly',
      isTransition: false,
      status: 'open',
    })

    const second = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs }
    )
    expect(second._id).toBe(first._id)

    const listed = await teacher.client.query(
      api.features.payroll.listPayPeriodsForOrganization,
      { organizationId }
    )
    expect(listed).toHaveLength(1)
    expect(listed[0]?._id).toBe(first._id)
  })

  test('maps inconsistent biweekly settings to a user-facing ConvexError', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    await t.run(async ctx => {
      const settings = await ctx.db
        .query('classSettings')
        .withIndex('by_organizationId', q =>
          q.eq('organizationId', organizationId)
        )
        .unique()
      if (settings === null) {
        throw new Error('expected classSettings')
      }
      await ctx.db.patch('classSettings', settings._id, {
        paySchedule: {
          type: 'biweekly',
          weekday: 5,
          firstPayDate: '2025-07-15',
        },
      })
    })

    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 6, 29, 15, 0, 0))

    try {
      await teacher.client.mutation(api.features.payroll.ensureCurrentPayPeriod, {
        organizationId,
      })
      expect.unreachable('expected ensureCurrentPayPeriod to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      expect((error as ConvexError<string>).data).toBe(
        'The biweekly pay schedule is invalid. Open Settings, pick Bi-weekly again, and save.'
      )
    }
  })
})
