import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'

import { api } from '~/convex/_generated/api'
import { teacherContextQueryArgs } from '~/lib/admin-route-context'
import { userFacingErrorMessage } from '~/lib/user-facing-error'

import type { FunctionReturnType } from 'convex/server'

export function useAdminPayrollPage(
  orgSlug: string | undefined
): AdminPayrollPage {
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    teacherContextQueryArgs({ orgSlug })
  )
  const ensurePeriod = useMutation(api.features.payroll.ensureCurrentPayPeriod)
  const page = useQuery(
    api.features.payroll.getPayrollAdminPageForOrganization,
    context === undefined || context === null
      ? 'skip'
      : { organizationId: context.organizationId }
  )
  const [ensureError, setEnsureError] = useState<string | null>(null)

  useEffect(() => {
    if (context === undefined || context === null) {
      return
    }
    if (page === undefined || page !== null) {
      return
    }
    if (ensureError !== null) {
      return
    }

    let cancelled = false
    void ensurePeriod({ organizationId: context.organizationId })
      .then(() => {
        if (!cancelled) {
          setEnsureError(null)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setEnsureError(
            userFacingErrorMessage(
              error,
              'Could not prepare the current pay period.'
            )
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [context, page, ensureError, ensurePeriod])

  if (context === undefined) {
    return { status: 'loading' }
  }

  if (context === null) {
    return { status: 'unauthorized' }
  }

  if (ensureError !== null) {
    return { status: 'error', message: ensureError }
  }

  if (page === undefined || page === null) {
    return { status: 'loading' }
  }

  return {
    status: 'ready',
    organizationId: context.organizationId,
    page,
  }
}

/** @deprecated Prefer useAdminPayrollPage for the redesigned payroll screen. */
export function useAdminOpenPayPeriod(
  orgSlug: string | undefined
): AdminOpenPayPeriod {
  const payroll = useAdminPayrollPage(orgSlug)
  if (payroll.status !== 'ready') {
    return payroll
  }
  return {
    status: 'ready',
    organizationId: payroll.organizationId,
    details: payroll.page.current,
  }
}

type AdminPayrollPage =
  | { status: 'loading' }
  | { status: 'unauthorized' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      organizationId: string
      page: PayrollAdminPageData
    }

type AdminOpenPayPeriod =
  | { status: 'loading' }
  | { status: 'unauthorized' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      organizationId: string
      details: PayrollAdminPageData['current']
    }

type PayrollAdminPageData = NonNullable<
  FunctionReturnType<
    typeof api.features.payroll.getPayrollAdminPageForOrganization
  >
>
