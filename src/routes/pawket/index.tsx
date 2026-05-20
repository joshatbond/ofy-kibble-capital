import { createFileRoute, redirect } from '@tanstack/react-router'

import { RequireStudentAuth } from '~/components/auth/require-student-auth'
import { StudentAppShell } from '~/components/shell/student-app-shell'
import { studentAppLandingPath } from '~/lib/auth-redirect'
import { hasConvexAuthToken } from '~/lib/convex-auth-storage'

export const Route = createFileRoute('/pawket/')({
  beforeLoad: () => {
    if (!hasConvexAuthToken()) {
      throw redirect({
        to: studentAppLandingPath('pawket'),
        replace: true,
      })
    }
  },
  head: () => ({
    meta: [{ title: 'PawKet Exchange' }],
  }),
  component: PawketAppPage,
})

function PawketAppPage() {
  return (
    <RequireStudentAuth app="pawket">
      <StudentAppShell
        app="pawket"
        title="PawKet Exchange"
        subtitle="Student wallet and rewards (stub)."
      >
        <p className="text-muted-foreground text-base leading-relaxed">
          Protected app routes will live here — balances, goals, and PawKet
          rewards.
        </p>
      </StudentAppShell>
    </RequireStudentAuth>
  )
}
