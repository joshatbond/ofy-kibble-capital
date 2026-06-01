import { createFileRoute, redirect } from '@tanstack/react-router'

import { ClassroomRosterPanel } from '~/components/admin/classroom-roster-panel'
import { RequireTeacherAuth } from '~/components/auth/require-teacher-auth'
import { AdminAppShell } from '~/components/shell/admin-app-shell'
import { Case, SwitchOn } from '~/components/switch-on'
import { usePrimaryClassroomOrg } from '~/hooks/use-primary-classroom-org'
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
  const { organizationId, organizationName, isLoading } =
    usePrimaryClassroomOrg()

  return (
    <RequireTeacherAuth>
      <AdminAppShell
        title="Teacher administration"
        subtitle={
          organizationName !== undefined ? organizationName : 'Classroom hub'
        }
      >
        <SwitchOn>
          <Case predicate={isLoading}>
            <p className="text-muted-foreground text-base leading-relaxed">
              Loading classroom…
            </p>
          </Case>

          <Case predicate={!isLoading && organizationId === undefined}>
            <p className="text-muted-foreground text-base leading-relaxed">
              No classroom organization is linked to your account yet. Accept a
              teacher invitation or ask an operator to add you to the dev
              classroom seed.
            </p>
          </Case>

          <Case predicate={!isLoading && organizationId !== undefined}>
            <ClassroomRosterPanel organizationId={organizationId!} />
          </Case>
        </SwitchOn>
      </AdminAppShell>
    </RequireTeacherAuth>
  )
}
