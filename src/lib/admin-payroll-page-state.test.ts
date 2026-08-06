import { ConvexError } from 'convex/values'
import { describe, expect, test } from 'vitest'

import { resolveAdminPayrollPageState } from './admin-payroll-page-state'
import { normalizeSafeQueryResult } from './safe-query'

describe('normalizeSafeQueryResult', () => {
  test('maps undefined to pending', () => {
    expect(normalizeSafeQueryResult(undefined)).toEqual({ status: 'pending' })
  })

  test('maps data to success', () => {
    expect(normalizeSafeQueryResult({ ok: true })).toEqual({
      status: 'success',
      data: { ok: true },
    })
  })

  test('maps Error to error without throwing', () => {
    const error = new Error('boom')
    expect(normalizeSafeQueryResult(error)).toEqual({
      status: 'error',
      error,
    })
  })
})

describe('resolveAdminPayrollPageState', () => {
  const page = {
    current: { period: { _id: 'period_1' } },
    previousRuns: [],
    previousRunsHasMore: false,
  }

  test('stays loading while context is pending', () => {
    expect(
      resolveAdminPayrollPageState({
        context: { status: 'pending' },
        page: { status: 'pending' },
        ensureError: null,
      })
    ).toEqual({ status: 'loading' })
  })

  test('stays loading while page query is pending after context resolves', () => {
    expect(
      resolveAdminPayrollPageState({
        context: {
          status: 'success',
          data: { organizationId: 'org_1' },
        },
        page: { status: 'pending' },
        ensureError: null,
      })
    ).toEqual({ status: 'loading' })
  })

  test('surfaces context query errors with a user-facing message', () => {
    expect(
      resolveAdminPayrollPageState({
        context: {
          status: 'error',
          error: new ConvexError('Sign in to continue.'),
        },
        page: { status: 'pending' },
        ensureError: null,
      })
    ).toEqual({
      status: 'error',
      message: 'Sign in to continue.',
    })
  })

  test('treats null context as unauthorized', () => {
    expect(
      resolveAdminPayrollPageState({
        context: { status: 'success', data: null },
        page: { status: 'pending' },
        ensureError: null,
      })
    ).toEqual({ status: 'unauthorized' })
  })

  test('prefers ensure mutation errors before page success', () => {
    expect(
      resolveAdminPayrollPageState({
        context: {
          status: 'success',
          data: { organizationId: 'org_1' },
        },
        page: { status: 'success', data: page },
        ensureError: 'Could not prepare the current pay period.',
      })
    ).toEqual({
      status: 'error',
      message: 'Could not prepare the current pay period.',
    })
  })

  test('surfaces page query errors without crashing', () => {
    expect(
      resolveAdminPayrollPageState({
        context: {
          status: 'success',
          data: { organizationId: 'org_1' },
        },
        page: {
          status: 'error',
          error: new ConvexError('Could not load payroll.'),
        },
        ensureError: null,
      })
    ).toEqual({
      status: 'error',
      message: 'Could not load payroll.',
    })
  })

  test('stays loading while page is null (ensure in flight)', () => {
    expect(
      resolveAdminPayrollPageState({
        context: {
          status: 'success',
          data: { organizationId: 'org_1' },
        },
        page: { status: 'success', data: null },
        ensureError: null,
      })
    ).toEqual({ status: 'loading' })
  })

  test('returns ready when page data is present', () => {
    expect(
      resolveAdminPayrollPageState({
        context: {
          status: 'success',
          data: { organizationId: 'org_1' },
        },
        page: { status: 'success', data: page },
        ensureError: null,
      })
    ).toEqual({
      status: 'ready',
      organizationId: 'org_1',
      page,
    })
  })
})
