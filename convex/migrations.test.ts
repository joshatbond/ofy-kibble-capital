import { afterEach, describe, expect, test, vi } from 'vitest'

import { api, internal } from './_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from './test.setup'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('backfillPayRunTotals', () => {
  test('is idempotent on payRuns that already have denormalized totals', async () => {
    vi.useFakeTimers()
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '1')
    vi.stubEnv('INVITE_DEV_RELAXED', '1')

    const t = initConvexTest()
    const classroom = await setupDevTeacherClassroom(t)
    const { teacher, organizationId } = classroom

    const invited = await classroom.teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: 'migrate-payrun@ofy.org',
        externalStudentId: 3701,
        grade: 7,
        displayName: 'Migrate Kid',
      }
    )
    const student = await asAuthedUser(t, {
      email: 'migrate-payrun@ofy.org',
      name: 'Migrate Kid',
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

    const period = await t.mutation(
      internal.features.payrollTesting.ensureCurrentPayPeriod,
      { organizationId, nowMs: Date.UTC(2026, 6, 14, 15, 0, 0) }
    )

    const runId = await t.run(async ctx => {
      const payRunId = await ctx.db.insert('payRuns', {
        organizationId,
        payPeriodId: period._id,
        status: 'succeeded',
        triggeredBy: 'manual',
        startedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        completedAt: Date.UTC(2026, 6, 14, 15, 30, 0),
        totalFundsCents: 53_370,
        stubCount: 1,
      })

      await ctx.db.insert('paystubs', {
        organizationId,
        payPeriodId: period._id,
        payRunId,
        rosterStudentId,
        schoolYear: '2026-2027',
        daysAttended: 10,
        standardDayHours: 4,
        overtimeHours: 0,
        baseHours: 40,
        basePayCents: 60_000,
        overtimePayCents: 0,
        grossPayCents: 60_000,
        retirement401kCents: 0,
        medicalInsuranceCents: 0,
        taxableWagesCents: 60_000,
        federalIncomeTaxCents: 1_000,
        californiaIncomeTaxCents: 500,
        socialSecurityCents: 3_720,
        medicareCents: 870,
        caSdiCents: 540,
        netPayCents: 53_370,
        ytdGrossCents: 60_000,
        ytdTaxableWagesCents: 60_000,
        ytdRetirement401kCents: 0,
        ytdMedicalInsuranceCents: 0,
        ytdFederalIncomeTaxCents: 1_000,
        ytdCaliforniaIncomeTaxCents: 500,
        ytdSocialSecurityCents: 3_720,
        ytdMedicareCents: 870,
        ytdCaSdiCents: 540,
        ytdNetPayCents: 53_370,
        isCorrection: false,
        createdAt: Date.UTC(2026, 6, 14, 15, 30, 0),
      })

      return payRunId
    })

    await t.mutation(internal.migrations.runBackfillPayRunTotals, {})
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const after = await t.run(async ctx => ctx.db.get('payRuns', runId))
    expect(after).toMatchObject({
      totalFundsCents: 53_370,
      stubCount: 1,
    })

    const page = await teacher.client.query(
      api.features.payroll.getPayrollAdminPageForOrganization,
      { organizationId }
    )
    expect(
      page?.current.runs.find(run => run._id === runId)?.totalFundsCents
    ).toBe(53_370)
  })
})
