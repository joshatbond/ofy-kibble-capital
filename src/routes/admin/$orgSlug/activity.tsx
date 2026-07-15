import { Link, createFileRoute } from '@tanstack/react-router'
import { usePaginatedQuery, useQuery } from 'convex/react'
import { ArrowLeft } from 'lucide-react'

import { AdminPage } from '~/components/admin/admin-shell'
import { AdminClassroomActivityFeed } from '~/components/admin/classroom-activity-feed'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'
import { teacherContextQueryArgs } from '~/lib/admin-route-context'

export const Route = createFileRoute('/admin/$orgSlug/activity')({
  component: AdminClassroomActivityPage,
})

function AdminClassroomActivityPage() {
  const params = Route.useParams()
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    teacherContextQueryArgs(params)
  )
  const organizationId = context?.organizationId
  const activity = usePaginatedQuery(
    api.features.banking.listClassroomActivityHistory,
    organizationId === undefined ? 'skip' : { organizationId },
    { initialNumItems: 20 }
  )

  return (
    <SwitchOn>
      <Case predicate={context === undefined}>
        <main className="px-4 py-8">
          <p>Loading classroom activity…</p>
        </main>
      </Case>

      <Case predicate={context === null}>
        <main className="px-4 py-8">
          <p>This classroom does not match your teacher account.</p>

          <p>
            <Link to="/admin">Back to dashboard</Link>
          </p>
        </main>
      </Case>

      <Case>
        <AdminPage
          title="Classroom activity"
          description="Append-only ledger movements for every student in this classroom."
          action={
            <Link
              to="/admin/$orgSlug"
              params={params}
              className="border-ink bg-card shadow-brutal hover:bg-muted/40 inline-flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to roster
            </Link>
          }
        >
          <SwitchOn>
            <Case predicate={activity.status === 'LoadingFirstPage'}>
              <p className="text-muted-foreground text-sm">Loading activity…</p>
            </Case>

            <Case>
              <AdminClassroomActivityFeed
                rows={activity.results}
                emptyMessage="No classroom banking activity yet. Pay runs, store purchases, and transfers will appear here."
                canLoadMore={activity.status === 'CanLoadMore'}
                onLoadMore={() => activity.loadMore(20)}
              />
            </Case>
          </SwitchOn>
        </AdminPage>
      </Case>
    </SwitchOn>
  )
}
