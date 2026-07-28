import { afterEach, describe, expect, test, vi } from 'vitest'

import { api, internal } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'

import {
  clockInProductTimezone,
  isPaydayAutomationClock,
} from './dates'
import { getEffectivePayDate } from './postpone'

import type { Id } from '../../_generated/dataModel'
import type { ConvexTest } from '../../test.setup'

afterEach(() => {
  vi.unstubAllEnvs()
})

/** 2026-07-14 08:30 America/Los_Angeles (PDT = UTC-7). */
const PAY_RUN_TIME_MS = Date.UTC(2026, 6, 14, 15, 30, 0)
/** Same calendar day, afternoon PT — not pay-run clock. */
const AFTERNOON_MS = Date.UTC(2026, 6, 14, 22, 0, 0)

describe('payday automation clock', () => {
  test('detects 8:30 AM product timezone', () => {
    expect(clockInProductTimezone(PAY_RUN_TIME_MS)).toEqual({
      hour: 8,
      minute: 30,
    })
    expect(isPaydayAutomationClock(PAY_RUN_TIME_MS)).toBe(true)
    expect(isPaydayAutomationClock(AFTERNOON_MS)).toBe(false)
  })
})

describe('postponePayPeriod', () => {
  test('records postponement and moves effective payday', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const period = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
      { organizationId, nowMs: AFTERNOON_MS }
    )

    const postponed = await teacher.client.mutation(
      api.features.payroll.postponePayPeriod,
      {
        organizationId,
        payPeriodId: period._id,
        postponedUntil: '2026-07-16',
        nowMs: AFTERNOON_MS,
      }
    )

    expect(postponed).toMatchObject({
      payPeriodId: period._id,
      postponedUntil: '2026-07-16',
      effectivePayDate: '2026-07-16',
    })

    const effective = await t.run(async ctx =>
      getEffectivePayDate(ctx, period._id, period.payDate)
    )
    expect(effective).toBe('2026-07-16')

    // Period work window unchanged; still open.
    const listed = await teacher.client.query(
      api.features.payroll.listPayPeriodsForOrganization,
      { organizationId }
    )
    expect(listed[0]).toMatchObject({
      _id: period._id,
      startDate: period.startDate,
      endDate: period.endDate,
      payDate: '2026-07-14',
      status: 'open',
    })
  })

  test('rejects postpone dates that are not after today / effective payday', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const period = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
      { organizationId, nowMs: AFTERNOON_MS }
    )

    await expect(
      teacher.client.mutation(api.features.payroll.postponePayPeriod, {
        organizationId,
        payPeriodId: period._id,
        postponedUntil: '2026-07-14',
        nowMs: AFTERNOON_MS,
      })
    ).rejects.toThrow(/after today/)
  })
})

describe('processPaydayAutomationCron', () => {
  test('no-ops outside 8:30 AM PT', async () => {
    const t = initConvexTest()
    await setupDevTeacherClassroom(t)

    expect(
      await t.mutation(internal.features.payrollCron.processPaydayAutomationCron, {
        nowMs: AFTERNOON_MS,
      })
    ).toMatchObject({
      outsidePayRunTime: true,
      attempted: 0,
    })
  })

  test('skips postponed periods until the new effective payday', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '1')
    vi.stubEnv('INVITE_DEV_RELAXED', '1')

    const t = initConvexTest()
    const { teacher, organizationId } = await setupActiveStudent(t)

    const period = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
      { organizationId, nowMs: AFTERNOON_MS }
    )

    await teacher.client.mutation(api.features.payroll.postponePayPeriod, {
      organizationId,
      payPeriodId: period._id,
      postponedUntil: '2026-07-16',
      nowMs: AFTERNOON_MS,
    })

    // Original payday morning — should not pay.
    expect(
      await t.mutation(internal.features.payrollCron.processPaydayAutomationCron, {
        nowMs: PAY_RUN_TIME_MS,
      })
    ).toMatchObject({
      outsidePayRunTime: false,
      succeeded: 0,
      blocked: 0,
    })

    const stillOpen = await teacher.client.query(
      api.features.payroll.listPayPeriodsForOrganization,
      { organizationId }
    )
    expect(stillOpen[0]?.status).toBe('open')
  })

  test('runs due classrooms at 8:30 AM PT', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '1')
    vi.stubEnv('INVITE_DEV_RELAXED', '1')

    const t = initConvexTest()
    const { teacher, organizationId, rosterStudentId } =
      await setupActiveStudent(t)

    await teacher.client.mutation(api.features.payroll.ensureCurrentPayPeriod, {
      organizationId,
      nowMs: AFTERNOON_MS,
    })

    const summary = await t.mutation(
      internal.features.payrollCron.processPaydayAutomationCron,
      { nowMs: PAY_RUN_TIME_MS }
    )

    expect(summary).toMatchObject({
      outsidePayRunTime: false,
      examinedClassrooms: 1,
      succeeded: 1,
      blocked: 0,
    })

    const stub = await t.run(async ctx => {
      return await ctx.db
        .query('paystubs')
        .withIndex('by_rosterStudentId', q =>
          q.eq('rosterStudentId', rosterStudentId)
        )
        .unique()
    })
    expect(stub?.grossPayCents).toBe(60_000)

    const periods = await teacher.client.query(
      api.features.payroll.listPayPeriodsForOrganization,
      { organizationId }
    )
    expect(periods[0]?.status).toBe('closed')
  })
})

async function setupActiveStudent(t: ConvexTest) {
  const classroom = await setupDevTeacherClassroom(t)
  const email = 'automation-student@ofy.org'

  const invited = await classroom.teacher.client.mutation(
    api.features.invitations.inviteStudent,
    {
      organizationId: classroom.organizationId,
      email,
      externalStudentId: 3301,
      grade: 7,
      displayName: 'Auto Kid',
    }
  )

  const student = await asAuthedUser(t, {
    email,
    name: 'Auto Kid',
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
