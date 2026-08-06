import { afterEach, describe, expect, test, vi } from 'vitest'

import { api, internal } from '../_generated/api'
import { initConvexTest, setupDevTeacherClassroom } from '../test.setup'

afterEach(() => {
  vi.useRealTimers()
})

describe('payrollTesting clock boundary', () => {
  test('internal ensure uses required nowMs for deterministic periods', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)

    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      {
        organizationId,
        nowMs: Date.UTC(2026, 6, 14, 15, 0, 0),
      }
    )

    expect(period).toMatchObject({
      organizationId,
      startDate: '2026-06-29',
      endDate: '2026-07-12',
      payDate: '2026-07-14',
      status: 'open',
    })
  })

  test('public ensureCurrentPayPeriod rejects client nowMs', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    await expect(
      teacher.client.mutation(api.features.payroll.ensureCurrentPayPeriod, {
        organizationId,
        nowMs: Date.UTC(2026, 6, 14, 15, 0, 0),
      } as { organizationId: string })
    ).rejects.toThrow(/nowMs|ArgumentValidation|Extra field/i)
  })

  test('public ensureCurrentPayPeriod uses server Date.now()', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 6, 14, 15, 0, 0))

    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const period = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
      { organizationId }
    )

    expect(period).toMatchObject({
      organizationId,
      payDate: '2026-07-14',
      status: 'open',
    })
  })
})
