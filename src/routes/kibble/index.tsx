import { createFileRoute } from '@tanstack/react-router'

import { RequireStudentAuth } from '~/components/auth/require-student-auth'
import { StudentAppShell } from '~/components/shell/student-app-shell'

export const Route = createFileRoute('/kibble/')({
  head: () => ({
    meta: [{ title: 'Kibble Capital' }],
  }),
  component: KibbleAppPage,
})

function KibbleAppPage() {
  return (
    <RequireStudentAuth app="kibble">
      <StudentAppShell
        app="kibble"
        title="Kibble Capital"
        subtitle="Student payroll dashboard (stub)."
      >
        <p className="text-muted-foreground text-base leading-relaxed">
          Protected app routes will live here — timekeeping, pay stubs, and your
          unified dashboard.
        </p>
      </StudentAppShell>
    </RequireStudentAuth>
  )
}
