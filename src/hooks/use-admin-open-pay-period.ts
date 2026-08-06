import { useMutation } from 'convex/react'
import { useEffect, useState } from 'react'

import { api } from '~/convex/_generated/api'
import { useSafeQuery } from '~/hooks/use-safe-query'
import { resolveAdminPayrollPageState } from '~/lib/admin-payroll-page-state'
import type { AdminPayrollPageState } from '~/lib/admin-payroll-page-state'
import { teacherContextQueryArgs } from '~/lib/admin-route-context'
import { userFacingErrorMessage } from '~/lib/user-facing-error'

import type { FunctionReturnType } from 'convex/server'

export function useAdminPayrollPage(
  orgSlug: string | undefined
): AdminPayrollPage {
  const context = useSafeQuery(
    api.features.admin.context.getTeacherClassroomContext,
    teacherContextQueryArgs({ orgSlug })
  )
  const ensurePeriod = useMutation(api.features.payroll.ensureCurrentPayPeriod)
  const organizationId =
    context.status === 'success' && context.data !== null
      ? context.data.organizationId
      : null
  const page = useSafeQuery(
    api.features.payroll.getPayrollAdminPageForOrganization,
    organizationId === null ? 'skip' : { organizationId }
  )
  const [ensureError, setEnsureError] = useState<string | null>(null)

  useEffect(() => {
    if (organizationId === null) {
      return
    }
    if (page.status !== 'success' || page.data !== null) {
      return
    }
    if (ensureError !== null) {
      return
    }

    let cancelled = false
    void ensurePeriod({ organizationId })
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
  }, [organizationId, page, ensureError, ensurePeriod])

  return resolveAdminPayrollPageState({
    context,
    page,
    ensureError,
  })
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

type PayrollAdminPageData = NonNullable<
  FunctionReturnType<
    typeof api.features.payroll.getPayrollAdminPageForOrganization
  >
>

type AdminPayrollPage = AdminPayrollPageState<PayrollAdminPageData>

type AdminOpenPayPeriod =
  | { status: 'loading' }
  | { status: 'unauthorized' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      organizationId: string
      details: PayrollAdminPageData['current']
    }
