import { afterEach, describe, expect, test, vi } from 'vitest'

import { api, internal } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'

import { PREVIOUS_PAY_RUNS_LIMIT } from './adminStatus'

import type { Id } from '../../_generated/dataModel'
import type { ConvexTest } from '../../test.setup'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getPayPeriodAdminDetailsForOrganization', () => {
  test('rejects unauthenticated callers', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    await expect(
      t.query(api.features.payroll.getPayPeriodAdminDetailsForOrganization, {
        organizationId,
        payPeriodId: period._id,
      })
    ).rejects.toThrow(/Sign in to continue/)
  })

  test('rejects non-teacher callers', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })

    await expect(
      stranger.client.query(
        api.features.payroll.getPayPeriodAdminDetailsForOrganization,
        { organizationId, payPeriodId: period._id }
      )
    ).rejects.toThrow(/Teacher access required/)
  })

  test('rejects missing pay periods', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const missingId = await t.run(async ctx => {
      const id = await ctx.db.insert('payPeriods', {
        organizationId,
        startDate: '2026-07-06',
        endDate: '2026-07-12',
        payDate: '2026-07-17',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'open',
        createdAt: Date.UTC(2026, 6, 14, 15, 0, 0),
      })
      await ctx.db.delete('payPeriods', id)
      return id
    })

    await expect(
      teacher.client.query(
        api.features.payroll.getPayPeriodAdminDetailsForOrganization,
        { organizationId, payPeriodId: missingId }
      )
    ).rejects.toThrow(/Pay period not found/)
  })

  test('rejects pay periods from another organization', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const foreignPeriodId = await t.run(async ctx => {
      return await ctx.db.insert('payPeriods', {
        organizationId: 'org_foreign',
        startDate: '2026-07-06',
        endDate: '2026-07-12',
        payDate: '2026-07-17',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'open',
        createdAt: Date.UTC(2026, 6, 14, 15, 0, 0),
      })
    })

    await expect(
      teacher.client.query(
        api.features.payroll.getPayPeriodAdminDetailsForOrganization,
        { organizationId, payPeriodId: foreignPeriodId }
      )
    ).rejects.toThrow(/does not belong to this organization/)
  })

  test('returns period, effective payday, attendance gate, and null latest run', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const details = await teacher.client.query(
      api.features.payroll.getPayPeriodAdminDetailsForOrganization,
      { organizationId, payPeriodId: period._id }
    )

    expect(details.period._id).toBe(period._id)
    expect(details.period.status).toBe('open')
    expect(details.effectivePayDate).toBe(period.payDate)
    expect(details.attendance).toMatchObject({
      status: 'blocked',
      activeStudentCount: 0,
      blockReasons: ['No active students on the roster.'],
    })
    expect(details.latestRun).toBeNull()
    expect(details.runs).toEqual([])
  })

  test('reports ready attendance when an active student is on the roster', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '1')
    vi.stubEnv('INVITE_DEV_RELAXED', '1')

    const t = initConvexTest()
    const { teacher, organizationId } = await setupActiveStudent(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const details = await teacher.client.query(
      api.features.payroll.getPayPeriodAdminDetailsForOrganization,
      { organizationId, payPeriodId: period._id }
    )

    expect(details.attendance).toEqual({
      status: 'ready',
      activeStudentCount: 1,
      payPeriodId: period._id,
    })
    expect(details.latestRun).toBeNull()
    expect(details.runs).toEqual([])
  })

  test('surfaces postpone as effective payday and latest run', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    await t.mutation(internal.features.payrollTesting.postponePayPeriod, {
      organizationId,
      payPeriodId: period._id,
      postponedUntil: '2026-07-21',
      nowMs: Date.UTC(2026, 6, 14, 16, 0, 0),
    })

    const details = await teacher.client.query(
      api.features.payroll.getPayPeriodAdminDetailsForOrganization,
      { organizationId, payPeriodId: period._id }
    )

    expect(details.effectivePayDate).toBe('2026-07-21')
    expect(details.latestRun).toMatchObject({
      status: 'postponed',
      triggeredBy: 'manual',
      postponedUntil: '2026-07-21',
    })
  })

  test('surfaces the latest blocked pay run after a manual attempt', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const run = await t.mutation(internal.features.payrollTesting.runPayPeriod, {
      organizationId,
      payPeriodId: period._id,
      nowMs: Date.UTC(2026, 6, 14, 15, 30, 0),
    })

    expect(run.status).toBe('blocked')

    const details = await teacher.client.query(
      api.features.payroll.getPayPeriodAdminDetailsForOrganization,
      { organizationId, payPeriodId: period._id }
    )

    expect(details.latestRun).toMatchObject({
      status: 'blocked',
      triggeredBy: 'manual',
      blockReasons: ['No active students on the roster.'],
    })
    expect(details.attendance.status).toBe('blocked')
  })

  test('returns null when no open pay period exists', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    expect(
      await teacher.client.query(
        api.features.payroll.getOpenPayPeriodAdminDetailsForOrganization,
        { organizationId }
      )
    ).toBeNull()
  })

  test('returns open-period details without an id argument', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const details = await teacher.client.query(
      api.features.payroll.getOpenPayPeriodAdminDetailsForOrganization,
      { organizationId }
    )

    expect(details?.period._id).toBe(period._id)
    expect(details?.period.status).toBe('open')
  })
})

describe('getPayrollAdminPageForOrganization', () => {
  test('rejects unauthenticated callers', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)

    await expect(
      t.query(api.features.payroll.getPayrollAdminPageForOrganization, {
        organizationId,
      })
    ).rejects.toThrow(/Sign in to continue/)
  })

  test('rejects non-teacher callers', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)
    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })

    await expect(
      stranger.client.query(
        api.features.payroll.getPayrollAdminPageForOrganization,
        { organizationId }
      )
    ).rejects.toThrow(/Teacher access required/)
  })

  test('rejects callers for a foreign organization', async () => {
    const t = initConvexTest()
    const { teacher } = await setupDevTeacherClassroom(t)

    await expect(
      teacher.client.query(
        api.features.payroll.getPayrollAdminPageForOrganization,
        { organizationId: 'org_foreign' }
      )
    ).rejects.toThrow(/Teacher access required/)
  })

  test('returns null when no open pay period exists', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    expect(
      await teacher.client.query(
        api.features.payroll.getPayrollAdminPageForOrganization,
        { organizationId }
      )
    ).toBeNull()
  })

  test('returns current-period details for an open period', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const page = await teacher.client.query(
      api.features.payroll.getPayrollAdminPageForOrganization,
      { organizationId }
    )

    expect(page).not.toBeNull()
    expect(page?.current.period._id).toBe(period._id)
    expect(page?.current.period.status).toBe('open')
    expect(page?.current.effectivePayDate).toBe(period.payDate)
    expect(page?.current.attendance).toMatchObject({
      status: 'blocked',
      activeStudentCount: 0,
      blockReasons: ['No active students on the roster.'],
    })
    expect(page?.current.latestRun).toBeNull()
    expect(page?.current.runs).toEqual([])
    expect(page?.previousRuns).toEqual([])
    expect(page?.previousRunsHasMore).toBe(false)
  })

  test('reports ready attendance on the current period when a student is active', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '1')
    vi.stubEnv('INVITE_DEV_RELAXED', '1')

    const t = initConvexTest()
    const { teacher, organizationId } = await setupActiveStudent(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const page = await teacher.client.query(
      api.features.payroll.getPayrollAdminPageForOrganization,
      { organizationId }
    )

    expect(page?.current.attendance).toEqual({
      status: 'ready',
      activeStudentCount: 1,
      payPeriodId: period._id,
    })
  })

  test('lists previous succeeded and blocked runs reverse-chronologically and excludes postponed', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const openPeriod = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const seeded = await t.run(async ctx => {
      const closedSucceeded = await ctx.db.insert('payPeriods', {
        organizationId,
        startDate: '2026-06-01',
        endDate: '2026-06-14',
        payDate: '2026-06-16',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'closed',
        createdAt: Date.UTC(2026, 5, 1, 12, 0, 0),
        closedAt: Date.UTC(2026, 5, 16, 15, 0, 0),
      })
      const closedBlocked = await ctx.db.insert('payPeriods', {
        organizationId,
        startDate: '2026-06-15',
        endDate: '2026-06-28',
        payDate: '2026-06-30',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'closed',
        createdAt: Date.UTC(2026, 5, 15, 12, 0, 0),
        closedAt: Date.UTC(2026, 5, 30, 15, 0, 0),
      })
      const closedPostponed = await ctx.db.insert('payPeriods', {
        organizationId,
        startDate: '2026-05-18',
        endDate: '2026-05-31',
        payDate: '2026-06-02',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'closed',
        createdAt: Date.UTC(2026, 4, 18, 12, 0, 0),
        closedAt: Date.UTC(2026, 5, 2, 15, 0, 0),
      })

      const succeededId = await ctx.db.insert('payRuns', {
        organizationId,
        payPeriodId: closedSucceeded,
        status: 'succeeded',
        triggeredBy: 'manual',
        startedAt: Date.UTC(2026, 5, 16, 15, 0, 0),
        completedAt: Date.UTC(2026, 5, 16, 15, 1, 0),
        totalFundsCents: 0,
        stubCount: 0,
      })
      const blockedId = await ctx.db.insert('payRuns', {
        organizationId,
        payPeriodId: closedBlocked,
        status: 'blocked',
        triggeredBy: 'manual',
        blockReasons: ['No active students on the roster.'],
        startedAt: Date.UTC(2026, 5, 30, 15, 0, 0),
        completedAt: Date.UTC(2026, 5, 30, 15, 1, 0),
        totalFundsCents: 0,
        stubCount: 0,
      })
      await ctx.db.insert('payRuns', {
        organizationId,
        payPeriodId: closedPostponed,
        status: 'postponed',
        triggeredBy: 'manual',
        postponedUntil: '2026-06-09',
        startedAt: Date.UTC(2026, 5, 2, 16, 0, 0),
        completedAt: Date.UTC(2026, 5, 2, 16, 0, 0),
        totalFundsCents: 0,
        stubCount: 0,
      })

      return { succeededId, blockedId }
    })

    const page = await teacher.client.query(
      api.features.payroll.getPayrollAdminPageForOrganization,
      { organizationId }
    )

    expect(page?.current.period._id).toBe(openPeriod._id)
    expect(page?.previousRuns).toHaveLength(2)
    expect(page?.previousRuns.map(run => run._id)).toEqual([
      seeded.blockedId,
      seeded.succeededId,
    ])
    expect(page?.previousRuns[0]?.status).toBe('blocked')
    expect(page?.previousRuns[1]?.status).toBe('succeeded')
    expect(page?.previousRuns.every(run => run.status !== 'postponed')).toBe(
      true
    )
    const startedAts = page?.previousRuns.map(run => run.startedAt) ?? []
    expect(startedAts).toEqual([...startedAts].sort((a, b) => b - a))
    expect(page?.previousRunsHasMore).toBe(false)
  })

  test('bounds previous run history and sets previousRunsHasMore', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const openPeriod = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    await t.run(async ctx => {
      for (let i = 0; i < PREVIOUS_PAY_RUNS_LIMIT + 3; i += 1) {
        const periodId = await ctx.db.insert('payPeriods', {
          organizationId,
          startDate: '2026-01-01',
          endDate: '2026-01-14',
          payDate: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
          scheduleType: 'biweekly',
          isTransition: false,
          status: 'closed',
          createdAt: Date.UTC(2026, 0, 1, 12, 0, i),
          closedAt: Date.UTC(2026, 0, 15, 15, 0, i),
        })
        await ctx.db.insert('payRuns', {
          organizationId,
          payPeriodId: periodId,
          status: i % 2 === 0 ? 'succeeded' : 'blocked',
          triggeredBy: 'manual',
          startedAt: Date.UTC(2026, 0, 15, 15, 0, i),
          completedAt: Date.UTC(2026, 0, 15, 15, 1, i),
          totalFundsCents: i % 2 === 0 ? 1000 + i : 0,
          stubCount: i % 2 === 0 ? 1 : 0,
        })
      }
    })

    const page = await teacher.client.query(
      api.features.payroll.getPayrollAdminPageForOrganization,
      { organizationId }
    )

    expect(page?.current.period._id).toBe(openPeriod._id)
    expect(page?.previousRuns).toHaveLength(PREVIOUS_PAY_RUNS_LIMIT)
    expect(page?.previousRunsHasMore).toBe(true)
    expect(
      page?.previousRuns.every(
        run => run.status === 'succeeded' || run.status === 'blocked'
      )
    ).toBe(true)
  })
})

describe('getPayRunAdminReportForOrganization', () => {
  test('rejects unauthenticated callers', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)
    const payRunId = await t.run(async ctx => {
      const periodId = await ctx.db.insert('payPeriods', {
        organizationId,
        startDate: '2026-07-06',
        endDate: '2026-07-12',
        payDate: '2026-07-17',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'open',
        createdAt: Date.UTC(2026, 6, 14, 15, 0, 0),
      })
      return await ctx.db.insert('payRuns', {
        organizationId,
        payPeriodId: periodId,
        status: 'blocked',
        triggeredBy: 'manual',
        blockReasons: ['No active students on the roster.'],
        startedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        completedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        totalFundsCents: 0,
        stubCount: 0,
      })
    })

    await expect(
      t.query(api.features.payroll.getPayRunAdminReportForOrganization, {
        organizationId,
        payRunId,
      })
    ).rejects.toThrow(/Sign in to continue/)
  })

  test('rejects non-teacher callers', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)
    const payRunId = await t.run(async ctx => {
      const periodId = await ctx.db.insert('payPeriods', {
        organizationId,
        startDate: '2026-07-06',
        endDate: '2026-07-12',
        payDate: '2026-07-17',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'open',
        createdAt: Date.UTC(2026, 6, 14, 15, 0, 0),
      })
      return await ctx.db.insert('payRuns', {
        organizationId,
        payPeriodId: periodId,
        status: 'blocked',
        triggeredBy: 'manual',
        blockReasons: ['No active students on the roster.'],
        startedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        completedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        totalFundsCents: 0,
        stubCount: 0,
      })
    })
    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })

    await expect(
      stranger.client.query(
        api.features.payroll.getPayRunAdminReportForOrganization,
        { organizationId, payRunId }
      )
    ).rejects.toThrow(/Teacher access required/)
  })

  test('rejects missing and foreign-organization run ids', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const missingId = await t.run(async ctx => {
      const periodId = await ctx.db.insert('payPeriods', {
        organizationId,
        startDate: '2026-07-06',
        endDate: '2026-07-12',
        payDate: '2026-07-17',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'open',
        createdAt: Date.UTC(2026, 6, 14, 15, 0, 0),
      })
      const id = await ctx.db.insert('payRuns', {
        organizationId,
        payPeriodId: periodId,
        status: 'blocked',
        triggeredBy: 'manual',
        startedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        completedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        totalFundsCents: 0,
        stubCount: 0,
      })
      await ctx.db.delete('payRuns', id)
      return id
    })

    await expect(
      teacher.client.query(
        api.features.payroll.getPayRunAdminReportForOrganization,
        { organizationId, payRunId: missingId }
      )
    ).rejects.toThrow(/Pay run not found/)

    const foreignRunId = await t.run(async ctx => {
      const periodId = await ctx.db.insert('payPeriods', {
        organizationId: 'org_foreign',
        startDate: '2026-07-06',
        endDate: '2026-07-12',
        payDate: '2026-07-17',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'closed',
        createdAt: Date.UTC(2026, 6, 14, 15, 0, 0),
      })
      return await ctx.db.insert('payRuns', {
        organizationId: 'org_foreign',
        payPeriodId: periodId,
        status: 'succeeded',
        triggeredBy: 'manual',
        startedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        completedAt: Date.UTC(2026, 6, 14, 15, 31, 0),
        totalFundsCents: 0,
        stubCount: 0,
      })
    })

    await expect(
      teacher.client.query(
        api.features.payroll.getPayRunAdminReportForOrganization,
        { organizationId, payRunId: foreignRunId }
      )
    ).rejects.toThrow(/does not belong to this organization/)
  })

  test('rejects when the pay period belongs to another organization', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const payRunId = await t.run(async ctx => {
      const foreignPeriodId = await ctx.db.insert('payPeriods', {
        organizationId: 'org_foreign_period',
        startDate: '2026-07-06',
        endDate: '2026-07-12',
        payDate: '2026-07-17',
        scheduleType: 'biweekly',
        isTransition: false,
        status: 'closed',
        createdAt: Date.UTC(2026, 6, 14, 15, 0, 0),
      })
      return await ctx.db.insert('payRuns', {
        organizationId,
        payPeriodId: foreignPeriodId,
        status: 'blocked',
        triggeredBy: 'manual',
        blockReasons: ['No active students on the roster.'],
        startedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        completedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        totalFundsCents: 0,
        stubCount: 0,
      })
    })

    await expect(
      teacher.client.query(
        api.features.payroll.getPayRunAdminReportForOrganization,
        { organizationId, payRunId }
      )
    ).rejects.toThrow(/Pay period does not belong to this organization/)
  })

  test('returns empty stubs for a blocked run without failing', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const run = await t.mutation(internal.features.payrollTesting.runPayPeriod, {
      organizationId,
      payPeriodId: period._id,
      nowMs: Date.UTC(2026, 6, 14, 15, 30, 0),
    })
    expect(run.status).toBe('blocked')
    expect(run.status === 'blocked').toBe(true)

    const report = await teacher.client.query(
      api.features.payroll.getPayRunAdminReportForOrganization,
      { organizationId, payRunId: run.payRunId }
    )

    expect(report.studentCount).toBe(0)
    expect(report.fundsDispersedCents).toBe(0)
    expect(report.stubs).toEqual([])
    expect(report.stubs).toHaveLength(0)
    expect(report.run).toMatchObject({
      status: 'blocked',
      blockReasons: ['No active students on the roster.'],
      totalFundsCents: 0,
    })
  })

  test('returns succeeded-run student lines with withholdings, rates, pay-split, and stable sort', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '1')
    vi.stubEnv('INVITE_DEV_RELAXED', '1')

    const t = initConvexTest()
    const classroom = await setupDevTeacherClassroom(t)
    const { teacher, organizationId } = classroom

    const zebra = await inviteAndAcceptStudent(t, classroom, {
      email: 'zebra@ofy.org',
      displayName: 'Zebra Kid',
      externalStudentId: 3401,
    })
    const alpha = await inviteAndAcceptStudent(t, classroom, {
      email: 'alpha@ofy.org',
      displayName: 'Alpha Kid',
      externalStudentId: 3402,
    })

    await t.run(async ctx => {
      await ctx.db.insert('paySplits', {
        organizationId,
        rosterStudentId: alpha.rosterStudentId,
        savingsPercent: 30,
        checkingPercent: 70,
        updatedAt: Date.UTC(2026, 6, 14, 12, 0, 0),
      })
      await ctx.db.patch('rosterStudents', zebra.rosterStudentId, {
        displayName: '   ',
      })
    })

    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )
    const run = await t.mutation(internal.features.payrollTesting.runPayPeriod, {
      organizationId,
      payPeriodId: period._id,
      nowMs: Date.UTC(2026, 6, 14, 15, 30, 0),
    })
    expect(run.status).toBe('succeeded')
    expect(run.status === 'succeeded').toBe(true)

    const report = await teacher.client.query(
      api.features.payroll.getPayRunAdminReportForOrganization,
      { organizationId, payRunId: run.payRunId }
    )

    expect(report.studentCount).toBe(2)
    expect(report.stubs).toHaveLength(2)
    expect(report.stubs.map(stub => stub.displayName)).toEqual([
      'Alpha Kid',
      'zebra@ofy.org',
    ])

    const alphaLine = report.stubs[0]
    const zebraLine = report.stubs[1]
    expect(alphaLine.rosterStudentId).toBe(alpha.rosterStudentId)
    expect(zebraLine.rosterStudentId).toBe(zebra.rosterStudentId)

    for (const line of report.stubs) {
      expect(line.grossPayCents).toBe(60_000)
      expect(line.netPayCents).toBeGreaterThan(0)
      expect(line.netPayCents).toBeLessThan(line.grossPayCents)
      expect(line.regularRateCents).toBe(1_500)
      expect(line.overtimeRateCents).toBe(0)
      expect(line.overtimeHours).toBe(0)
      expect(line.retirement401kCents).toBeGreaterThanOrEqual(0)
      expect(line.medicalInsuranceCents).toBeGreaterThanOrEqual(0)
      expect(line.federalIncomeTaxCents).toBeGreaterThanOrEqual(0)
      expect(line.californiaIncomeTaxCents).toBeGreaterThanOrEqual(0)
      expect(line.socialSecurityCents).toBeGreaterThanOrEqual(0)
      expect(line.medicareCents).toBeGreaterThanOrEqual(0)
      expect(line.caSdiCents).toBeGreaterThanOrEqual(0)
    }

    const checking = alphaLine.paySplit.find(share => share.label === 'Checking')
    const savings = alphaLine.paySplit.find(share => share.label === 'Savings')
    expect(checking?.percent).toBe(70)
    expect(savings?.percent).toBe(30)
    const expectedChecking = Math.round((alphaLine.netPayCents * 70) / 100)
    expect(checking?.amountCents).toBe(expectedChecking)
    expect(savings?.amountCents).toBe(alphaLine.netPayCents - expectedChecking)
    expect(
      (checking?.amountCents ?? 0) + (savings?.amountCents ?? 0)
    ).toBe(alphaLine.netPayCents)

    expect(report.fundsDispersedCents).toBe(
      alphaLine.netPayCents + zebraLine.netPayCents
    )
    expect(report.run.totalFundsCents).toBe(report.fundsDispersedCents)
  })

  test('falls back to Student external id when display name and email are blank', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '1')
    vi.stubEnv('INVITE_DEV_RELAXED', '1')

    const t = initConvexTest()
    const classroom = await setupDevTeacherClassroom(t)
    const { teacher, organizationId } = classroom
    const student = await inviteAndAcceptStudent(t, classroom, {
      email: 'fallback@ofy.org',
      displayName: 'Will Clear',
      externalStudentId: 3501,
    })

    await t.run(async ctx => {
      await ctx.db.patch('rosterStudents', student.rosterStudentId, {
        displayName: '',
        email: '',
      })
    })

    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )
    const run = await t.mutation(internal.features.payrollTesting.runPayPeriod, {
      organizationId,
      payPeriodId: period._id,
      nowMs: Date.UTC(2026, 6, 14, 15, 30, 0),
    })
    expect(run.status).toBe('succeeded')

    const report = await teacher.client.query(
      api.features.payroll.getPayRunAdminReportForOrganization,
      { organizationId, payRunId: run.payRunId }
    )

    expect(report.stubs).toHaveLength(1)
    expect(report.stubs[0]?.displayName).toBe('Student 3501')
  })
})

async function setupActiveStudent(t: ConvexTest): Promise<{
  teacher: Awaited<ReturnType<typeof setupDevTeacherClassroom>>['teacher']
  organizationId: string
  rosterStudentId: Id<'rosterStudents'>
}> {
  const classroom = await setupDevTeacherClassroom(t)
  const invited = await inviteAndAcceptStudent(t, classroom, {
    email: 'admin-status-student@ofy.org',
    displayName: 'Admin Status Kid',
    externalStudentId: 3301,
  })

  return {
    teacher: classroom.teacher,
    organizationId: classroom.organizationId,
    rosterStudentId: invited.rosterStudentId,
  }
}

async function inviteAndAcceptStudent(
  t: ConvexTest,
  classroom: Awaited<ReturnType<typeof setupDevTeacherClassroom>>,
  args: {
    email: string
    displayName: string
    externalStudentId: number
  }
): Promise<{ rosterStudentId: Id<'rosterStudents'> }> {
  const invited = await classroom.teacher.client.mutation(
    api.features.invitations.inviteStudent,
    {
      organizationId: classroom.organizationId,
      email: args.email,
      externalStudentId: args.externalStudentId,
      grade: 7,
      displayName: args.displayName,
    }
  )

  const student = await asAuthedUser(t, {
    email: args.email,
    name: args.displayName,
    studentApp: 'kibble',
  })

  await student.client.mutation(
    api.features.invitations.acceptClassroomInvitation,
    { invitationId: invited.invitationId }
  )

  const rosterStudentId = await t.run(async ctx => {
    const roster = await ctx.db
      .query('rosterStudents')
      .withIndex('by_invitationId', q =>
        q.eq('invitationId', invited.invitationId)
      )
      .unique()
    return roster!._id
  })

  return { rosterStudentId }
}
