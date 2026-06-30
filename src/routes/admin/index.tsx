import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { AdminNav } from '~/components/admin/admin-nav'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'

export const Route = createFileRoute('/admin/')({
  component: AdminIndexPage,
})

function AdminIndexPage() {
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext
  )

  return (
    <SwitchOn>
      <Case predicate={context === undefined}>
        <main>
          <p>Loading your classroom…</p>
        </main>
      </Case>

      <Case predicate={context === null}>
        <main>
          <p>No classroom found for your account.</p>
        </main>
      </Case>

      <Case>
        <AdminDashboard />
      </Case>
    </SwitchOn>
  )
}

function AdminDashboard() {
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext
  )
  if (context == undefined) return null

  const classParams = {
    orgId: context.organizationId,
    classId: context.classroomId,
  }

  return (
    <main>
      <h1>Teacher admin</h1>

      <p>
        Signed in as <strong>{context.viewerEmail}</strong>
      </p>

      <p>{`${context.classroomName} (${context.siteSlug})`}</p>

      <AdminNav
        organizationId={context.organizationId}
        classroomId={context.classroomId}
        current="dashboard"
      />

      <section>
        <h2>Classroom roster &amp; invitations</h2>

        <p>
          Invite students and co-teachers, resend or revoke pending invites, and
          manage pay tokens for ID cards.
        </p>

        <p>
          <Link to="/admin/$orgId/$classId" params={classParams}>
            Open classroom roster
          </Link>
        </p>
      </section>

      <section>
        <h2>Classroom settings</h2>

        <p>
          View effective pay schedule, hourly rate, savings APY, and other
          economy settings for this classroom.
        </p>

        <p>
          <Link to="/admin/$orgId" params={{ orgId: context.organizationId }}>
            View settings
          </Link>
        </p>
      </section>

      <section>
        <h2>Student store</h2>

        <p>
          Manage catalog items for classroom checkout.&nbsp;
          <em>Checkout flows arrive in a later slice.</em>
        </p>

        <p>
          <Link to="/admin/$orgId/$classId/store" params={classParams}>
            Student store (coming soon)
          </Link>
        </p>
      </section>

      <section>
        <h2>POS</h2>

        <p>
          Scan student pay codes and post debits at the classroom store.{' '}
          <em>POS arrives in a later slice.</em>
        </p>

        <p>
          <Link to="/admin/$orgId/$classId/pos" params={classParams}>
            POS (coming soon)
          </Link>
        </p>
      </section>
    </main>
  )
}
