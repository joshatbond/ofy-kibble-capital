import { afterEach, describe, expect, test, vi } from 'vitest'

import { api } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'

import type { Id } from '../../_generated/dataModel'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('validateAttendanceForPayPeriod', () => {
  test('blocks when there are no active roster students', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const period = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
      {
        organizationId,
        nowMs: Date.UTC(2026, 6, 14, 15, 0, 0),
      }
    )

    const validation = await teacher.client.query(
      api.features.payroll.validateAttendanceForPayPeriod,
      { organizationId, payPeriodId: period._id }
    )

    expect(validation).toEqual({
      status: 'blocked',
      activeStudentCount: 0,
      payPeriodId: period._id,
      blockReasons: ['No active students on the roster.'],
    })
  })

  test('ready when stub covers every active student', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '1')
    vi.stubEnv('INVITE_DEV_RELAXED', '1')

    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const invited = await teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: 'ada@ofy.org',
        externalStudentId: 1001,
        grade: 7,
        displayName: 'Ada',
      }
    )

    const student = await asAuthedUser(t, {
      email: 'ada@ofy.org',
      name: 'Ada',
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

    const period = await teacher.client.mutation(
      api.features.payroll.ensureCurrentPayPeriod,
      {
        organizationId,
        nowMs: Date.UTC(2026, 6, 14, 15, 0, 0),
      }
    )

    const validation = await teacher.client.query(
      api.features.payroll.validateAttendanceForPayPeriod,
      { organizationId, payPeriodId: period._id }
    )

    expect(validation.status).toBe('ready')
    if (validation.status !== 'ready') {
      return
    }

    expect(validation.activeStudentCount).toBe(1)
    expect(validation.records).toHaveLength(1)
    expect(validation.records[0]).toMatchObject({
      rosterStudentId,
      externalStudentId: 1001,
      daysAttended: 10,
      overtimeHours: 0,
    })
  })
})
