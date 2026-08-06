import { ConvexError } from 'convex/values'
import { describe, expect, test } from 'vitest'

import type { Id } from '~/convex/_generated/dataModel'

import {
  emptyPaystubsMessage,
  resolvePayRunReportViewState,
  studentPayBreakdown,
} from './payroll-admin-report'

import type { AdminPaystubLine, PayBreakdownField } from './payroll-admin-report'

describe('studentPayBreakdown', () => {
  test('builds homogeneous panel groups with mixed field shapes', () => {
    const stub = sampleStub({
      baseHours: 40,
      overtimeHours: 2,
      grossPayCents: 62_000,
      basePayCents: 60_000,
      overtimePayCents: 2_000,
      regularRateCents: 1_500,
      overtimeRateCents: 2_250,
      retirement401kCents: 1_000,
      medicalInsuranceCents: 500,
      federalIncomeTaxCents: 2_000,
      californiaIncomeTaxCents: 800,
      socialSecurityCents: 3_720,
      medicareCents: 899,
      caSdiCents: 558,
    })

    const breakdown = studentPayBreakdown(stub)
    const groups = breakdown.panels.flatMap(panel => panel.groups)

    expect(breakdown.panels).toHaveLength(2)
    expect(breakdown.panels.map(panel => panel.title)).toEqual([
      'gross pay',
      'taxes and deductions',
    ])
    expect(groups.map(group => group.title)).toEqual([
      'Regular',
      'Overtime',
      'Pre-tax deductions',
      'taxes',
    ])

    const fields: Array<PayBreakdownField> = groups.flatMap(
      group => group.fields
    )
    expect(fields.some(field => 'value' in field)).toBe(true)
    expect(fields.some(field => 'cents' in field)).toBe(true)

    expect(breakdown.panels[0]?.amountCents).toBe(62_000)
    expect(breakdown.panels[1]?.amountCents).toBe(
      1_000 + 500 + 2_000 + 800 + 3_720 + 899 + 558
    )
  })
})

describe('resolvePayRunReportViewState', () => {
  test('maps pending to loading', () => {
    expect(resolvePayRunReportViewState({ status: 'pending' })).toEqual({
      status: 'loading',
    })
  })

  test('maps query errors to a user-facing message', () => {
    expect(
      resolvePayRunReportViewState({
        status: 'error',
        error: new ConvexError('Pay run not found.'),
      })
    ).toEqual({
      status: 'error',
      message: 'Pay run not found.',
    })
  })

  test('uses fallback when the error is not a ConvexError', () => {
    expect(
      resolvePayRunReportViewState({
        status: 'error',
        error: new Error(
          '[CONVEX Q(features/payroll:getPayRunAdminReport)] boom'
        ),
      })
    ).toEqual({
      status: 'error',
      message: 'Could not load pay run report.',
    })
  })

  test('maps success to ready with the report payload', () => {
    const report = {
      studentCount: 1,
      stubs: [{ displayName: 'Alpha Kid', netPayCents: 40_000 }],
      run: { status: 'succeeded' as const },
    }
    expect(
      resolvePayRunReportViewState({ status: 'success', data: report })
    ).toEqual({ status: 'ready', report })
  })

  test('maps blocked empty report success without treating it as an error', () => {
    const report = {
      studentCount: 0,
      fundsDispersedCents: 0,
      stubs: [],
      run: { status: 'blocked' as const },
    }
    const view = resolvePayRunReportViewState({
      status: 'success',
      data: report,
    })
    expect(view).toEqual({ status: 'ready', report })
    if (view.status !== 'ready') {
      expect.unreachable('expected ready report view')
    }
    expect(emptyPaystubsMessage(view.report.run.status)).toBe(
      'No paystubs — this run was blocked.'
    )
  })
})

describe('emptyPaystubsMessage', () => {
  test('explains empty stubs for blocked runs without calling it an error', () => {
    expect(emptyPaystubsMessage('blocked')).toBe(
      'No paystubs — this run was blocked.'
    )
  })

  test('uses calm empty copy for other run statuses', () => {
    expect(emptyPaystubsMessage('succeeded')).toBe('No paystubs for this run.')
    expect(emptyPaystubsMessage('postponed')).toBe('No paystubs for this run.')
  })
})

function sampleStub(
  overrides: Partial<AdminPaystubLine> &
    Pick<
      AdminPaystubLine,
      | 'baseHours'
      | 'overtimeHours'
      | 'grossPayCents'
      | 'basePayCents'
      | 'overtimePayCents'
      | 'regularRateCents'
      | 'overtimeRateCents'
      | 'retirement401kCents'
      | 'medicalInsuranceCents'
      | 'federalIncomeTaxCents'
      | 'californiaIncomeTaxCents'
      | 'socialSecurityCents'
      | 'medicareCents'
      | 'caSdiCents'
    >
): AdminPaystubLine {
  return {
    rosterStudentId: 'jd7abc1234567890abc123456' as Id<'rosterStudents'>,
    displayName: 'Test Student',
    netPayCents: 50_000,
    paySplit: [{ label: 'Checking', amountCents: 50_000, percent: 100 }],
    ...overrides,
  }
}
