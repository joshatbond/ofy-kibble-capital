import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { AdminNav } from '~/components/admin/admin-nav'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'

export const Route = createFileRoute('/admin/$orgId/$classId/store')({
  component: AdminStorePage,
})

function AdminStorePage() {
  const params = Route.useParams()
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext
  )

  const classroomMismatch =
    context !== undefined &&
    context !== null &&
    (context.organizationId !== params.orgId ||
      context.classroomId !== params.classId)

  return (
    <SwitchOn>
      <Case predicate={context === undefined}>
        <main>
          <p>Loading…</p>
        </main>
      </Case>

      <Case predicate={context === null}>
        <main>
          <p>No classroom found for your account.</p>
        </main>
      </Case>

      <Case predicate={classroomMismatch}>
        <main>
          <p>This classroom does not match your teacher account.</p>

          <p>
            <Link to="/admin">Back to dashboard</Link>
          </p>
        </main>
      </Case>

      <Case>
        <AdminStoreContent />
      </Case>
    </SwitchOn>
  )
}

function AdminStoreContent() {
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext
  )

  if (context === undefined || context === null) {
    return null
  }

  return (
    <main>
      <h1>Student store</h1>

      <p>
        <strong>{context.classroomName}</strong>
      </p>

      <AdminNav
        organizationId={context.organizationId}
        classroomId={context.classroomId}
        current="store"
      />

      <section>
        <h2>Catalog (coming soon)</h2>

        <p>
          Teachers define <strong>catalog items</strong> with a name and price.
          Stock is unlimited in v1 — no inventory counts. Deactivated items hide
          from POS but past sales stay in activity history.
        </p>

        <p>
          <em>Catalog CRUD and POS checkout arrive in Slice 8.</em>
        </p>
      </section>

      <p>
        <Link
          to="/admin/$orgId/$classId"
          params={{
            orgId: context.organizationId,
            classId: context.classroomId,
          }}
        >
          Classroom roster
        </Link>
      </p>
    </main>
  )
}
