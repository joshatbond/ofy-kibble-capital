import { userFacingErrorMessage } from './user-facing-error'

import type { SafeQueryResult } from './safe-query'

export function resolveAdminPayrollPageState<
  TContext extends { organizationId: string } | null,
  TPage,
>(args: {
  context: SafeQueryResult<TContext>
  page: SafeQueryResult<TPage | null>
  ensureError: string | null
}): AdminPayrollPageState<TPage> {
  if (args.context.status === 'pending') {
    return { status: 'loading' }
  }

  if (args.context.status === 'error') {
    return {
      status: 'error',
      message: userFacingErrorMessage(
        args.context.error,
        'Could not load classroom context.'
      ),
    }
  }

  if (args.context.data === null) {
    return { status: 'unauthorized' }
  }

  if (args.ensureError !== null) {
    return { status: 'error', message: args.ensureError }
  }

  if (args.page.status === 'error') {
    return {
      status: 'error',
      message: userFacingErrorMessage(
        args.page.error,
        'Could not load payroll.'
      ),
    }
  }

  if (args.page.status === 'pending' || args.page.data === null) {
    return { status: 'loading' }
  }

  return {
    status: 'ready',
    organizationId: args.context.data.organizationId,
    page: args.page.data,
  }
}

export type AdminPayrollPageState<TPage> =
  | { status: 'loading' }
  | { status: 'unauthorized' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      organizationId: string
      page: TPage
    }
