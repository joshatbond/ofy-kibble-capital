import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { AdminPayrollPage } from '~/components/admin/payroll-page'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { useAdminPayrollPage } from '~/hooks/use-admin-open-pay-period'

export const Route = createFileRoute('/admin/$orgSlug/pay')({
  component: AdminPayPageRoute,
})

function AdminPayPageRoute() {
  const params = Route.useParams()
  const [retryKey, setRetryKey] = useState(0)

  return (
    <AdminPayPageBody
      key={retryKey}
      orgSlug={params.orgSlug}
      onRetry={() => {
        setRetryKey(value => value + 1)
      }}
    />
  )
}

function AdminPayPageBody(props: {
  orgSlug: string
  onRetry: () => void
}) {
  const payroll = useAdminPayrollPage(props.orgSlug)

  return (
    <SwitchOn value={payroll}>
      <Case predicate={payroll.status === 'loading'}>
        <p className="text-muted-foreground p-8 text-sm">Loading payroll…</p>
      </Case>

      <Case predicate={payroll.status === 'unauthorized'}>
        <p className="p-8 text-sm">
          This classroom does not match your teacher account.
        </p>

        <p className="px-8 text-sm">
          <Link to="/admin" className="text-primary font-bold underline">
            Back to dashboard
          </Link>
        </p>
      </Case>

      <Case
        predicate={(
          state: typeof payroll
        ): state is Extract<typeof payroll, { status: 'error' }> =>
          state.status === 'error'}
      >
        {state => (
          <div className="grid gap-4 p-8">
            <p className="text-destructive text-sm font-bold" role="alert">
              {state.message}
            </p>

            <div>
              <Button type="button" variant="brutal-outline" onClick={props.onRetry}>
                Retry
              </Button>
            </div>
          </div>
        )}
      </Case>

      <Case
        predicate={(
          state: typeof payroll
        ): state is Extract<typeof payroll, { status: 'ready' }> =>
          state.status === 'ready'}
      >
        {state => (
          <AdminPayrollPage
            organizationId={state.organizationId}
            page={state.page}
          />
        )}
      </Case>
    </SwitchOn>
  )
}
