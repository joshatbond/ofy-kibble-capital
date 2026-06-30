import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { AdminSettingsPage } from '~/components/admin/settings-page'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'
import { teacherContextQueryArgs } from '~/lib/admin-route-context'

export const Route = createFileRoute('/admin/$orgId/')({
  component: AdminOrgPage,
})

function AdminOrgPage() {
  const params = Route.useParams()
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    teacherContextQueryArgs({ orgId: params.orgId })
  )
  const settings = useQuery(
    api.features.settings.effectiveSettingsForOrganization,
    context === undefined || context === null
      ? 'skip'
      : { organizationId: context.organizationId }
  )

  return (
    <SwitchOn>
      <Case predicate={context === undefined || settings === undefined}>
        <p className="p-8">Loading classroom settings…</p>
      </Case>

      <Case predicate={context === null}>
        <p className="p-8">
          This classroom does not match your teacher account.
        </p>

        <p className="px-8">
          <Link to="/admin">Back to dashboard</Link>
        </p>
      </Case>

      <Case>
        {context !== null && context !== undefined && settings !== undefined ? (
          <AdminSettingsPage
            key={context.organizationId}
            organizationId={context.organizationId}
            classroomName={context.classroomName}
            settings={settings}
          />
        ) : null}
      </Case>
    </SwitchOn>
  )
}
