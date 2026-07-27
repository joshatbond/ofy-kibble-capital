import { afterEach, describe, expect, test, vi } from 'vitest'

import { api } from '../../_generated/api'
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

describe('runPayPeriod', () => {
  test('blocks when there are no active students and keeps the period open', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const period = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const result = await teacher.client.mutation(
      api.features.payroll.runPayPeriod,
      {
        organizationId,
        payPeriodId: period._id,
        nowMs: Date.UTC(2026, 6, 14, 15, 30, 0),
      }
    )

    expect(result).toMatchObject({
      status: 'blocked',
      payPeriodId: period._id,
      blockReasons: ['No active students on the roster.'],
    })

    const periods = await teacher.client.query(
      api.features.payroll.listPayPeriodsForOrganization,
      { organizationId }
    )
    expect(periods[0]?.status).toBe('open')
  })

  test('posts stubs, credits net pay, closes the period, and is idempotent', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '1')
    vi.stubEnv('INVITE_DEV_RELAXED', '1')

    const t = initConvexTest()
    const { teacher, organizationId, rosterStudentId, student } =
      await setupActiveStudent(t)

    const period = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const first = await teacher.client.mutation(
      api.features.payroll.runPayPeriod,
      {
        organizationId,
        payPeriodId: period._id,
        nowMs: Date.UTC(2026, 6, 14, 15, 30, 0),
      }
    )

    expect(first).toMatchObject({
      status: 'succeeded',
      stubCount: 1,
      alreadyCompleted: false,
    })

    const stub = await t.run(async ctx => {
      const stubs = await ctx.db
        .query('paystubs')
        .withIndex('by_payPeriod_rosterStudent', q =>
          q.eq('payPeriodId', period._id).eq('rosterStudentId', rosterStudentId)
        )
        .unique()
      return stubs
    })

    expect(stub).toMatchObject({
      rosterStudentId,
      daysAttended: 10,
      overtimeHours: 0,
      grossPayCents: 60_000,
      isCorrection: false,
      schoolYear: '2026-2027',
    })
    expect(stub?.netPayCents).toBeGreaterThan(0)

    const balances = await student.client.query(
      api.features.banking.getMyBalances,
      {}
    )
    expect(balances?.checkingCents).toBe(stub?.netPayCents)

    const ledger = await t.run(async ctx => {
      return await ctx.db
        .query('ledgerEntries')
        .withIndex('by_rosterStudent_createdAt', q =>
          q.eq('rosterStudentId', rosterStudentId)
        )
        .collect()
    })
    expect(ledger.some(entry => entry.entryType === 'net_pay')).toBe(true)

    const periods = await teacher.client.query(
      api.features.payroll.listPayPeriodsForOrganization,
      { organizationId }
    )
    expect(periods[0]).toMatchObject({
      _id: period._id,
      status: 'closed',
    })

    const second = await teacher.client.mutation(
      api.features.payroll.runPayPeriod,
      {
        organizationId,
        payPeriodId: period._id,
        nowMs: Date.UTC(2026, 6, 14, 16, 0, 0),
      }
    )

    expect(second).toMatchObject({
      status: 'succeeded',
      payRunId: first.status === 'succeeded' ? first.payRunId : undefined,
      stubCount: 1,
      alreadyCompleted: true,
    })

    const stubCount = await t.run(async ctx => {
      const stubs = await ctx.db
        .query('paystubs')
        .withIndex('by_payRunId', q =>
          q.eq(
            'payRunId',
            first.status === 'succeeded' ? first.payRunId : ('' as Id<'payRuns'>)
          )
        )
        .collect()
      return stubs.length
    })
    expect(stubCount).toBe(1)
  })
})

async function setupActiveStudent(t: ConvexTest) {
  const classroom = await setupDevTeacherClassroom(t)
  const email = 'payrun-student@ofy.org'

  const invited = await classroom.teacher.client.mutation(
    api.features.invitations.inviteStudent,
    {
      organizationId: classroom.organizationId,
      email,
      externalStudentId: 2201,
      grade: 7,
      displayName: 'Pay Run Kid',
    }
  )

  const student = await asAuthedUser(t, {
    email,
    name: 'Pay Run Kid',
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
    student,
    organizationId: classroom.organizationId,
    rosterStudentId,
  }
}
