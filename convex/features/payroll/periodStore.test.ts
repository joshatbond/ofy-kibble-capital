import { describe, expect, test } from 'vitest'

import { api } from '../../_generated/api'
import { initConvexTest, setupDevTeacherClassroom } from '../../test.setup'

describe('ensureCurrentPayPeriod', () => {
  test('creates the biweekly period for the next payday and is idempotent', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    // Seeded defaults: biweekly Tuesday from 2026-07-14.
    const nowMs = Date.UTC(2026, 6, 14, 15, 0, 0)
    const first = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
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

    const second = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
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
})
