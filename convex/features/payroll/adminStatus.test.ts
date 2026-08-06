import { afterEach, describe, expect, test, vi } from 'vitest'

import { api, internal } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'

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

  test('returns empty stubs for a blocked run report without failing', async () => {
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
    if (run.status !== 'blocked') {
      return
    }

    const report = await teacher.client.query(
      api.features.payroll.getPayRunAdminReportForOrganization,
      { organizationId, payRunId: run.payRunId }
    )

    expect(report).toMatchObject({
      studentCount: 0,
      fundsDispersedCents: 0,
      stubs: [],
      run: {
        status: 'blocked',
        blockReasons: ['No active students on the roster.'],
      },
    })
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

async function setupActiveStudent(t: ConvexTest): Promise<{
  teacher: Awaited<ReturnType<typeof setupDevTeacherClassroom>>['teacher']
  organizationId: string
  rosterStudentId: Id<'rosterStudents'>
}> {
  const classroom = await setupDevTeacherClassroom(t)
  const email = 'admin-status-student@ofy.org'

  const invited = await classroom.teacher.client.mutation(
    api.features.invitations.inviteStudent,
    {
      organizationId: classroom.organizationId,
      email,
      externalStudentId: 3301,
      grade: 7,
      displayName: 'Admin Status Kid',
    }
  )

  const student = await asAuthedUser(t, {
    email,
    name: 'Admin Status Kid',
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

  return {
    teacher: classroom.teacher,
    organizationId: classroom.organizationId,
    rosterStudentId,
  }
}
