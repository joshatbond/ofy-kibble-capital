import { createFileRoute, redirect } from '@tanstack/react-router'

import { RequireTeacherAuth } from '~/components/auth/require-teacher-auth'
import { AdminAppShell } from '~/components/shell/admin-app-shell'
import { adminLandingPath } from '~/lib/admin-auth-redirect'
import { hasConvexAuthToken } from '~/lib/convex-auth-storage'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    if (!hasConvexAuthToken()) {
      throw redirect({
        to: adminLandingPath(),
        replace: true,
      })
    }
  },
  head: () => ({
    meta: [{ title: 'Teacher admin' }],
  }),
  component: AdminHomePage,
})

function AdminHomePage() {
  return (
    <RequireTeacherAuth>
      <AdminAppShell
        title="Teacher administration"
        subtitle="Classroom hub (stub)."
      >
        <p className="text-muted-foreground text-base leading-relaxed">
          Rosters, payroll inputs, store POS, and invitations will live here. v1
          uses operator seed for classrooms; teacher invites arrive in Slice 2.
        </p>
      </AdminAppShell>
    </RequireTeacherAuth>
  )
}
