import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { AdminNav } from '~/components/admin/admin-nav'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'

export const Route = createFileRoute('/admin/$orgId/$classId/pos')({
  component: AdminPosPage,
})

function AdminPosPage() {
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
    <main>
      <SwitchOn>
        <Case predicate={context === undefined}>
          <p>Loading…</p>
        </Case>

        <Case predicate={context === null}>
          <p>No classroom found for your account.</p>
        </Case>

        <Case predicate={classroomMismatch}>
          <p>This classroom does not match your teacher account.</p>

          <p>
            <Link to="/admin">Back to dashboard</Link>
          </p>
        </Case>

        <Case>
          <AdminPosContent />
        </Case>
      </SwitchOn>
    </main>
  )
}

function AdminPosContent() {
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext
  )

  if (context === undefined || context === null) {
    return null
  }

  return (
    <>
      <h1>POS</h1>

      <p>
        <strong>{context.classroomName}</strong>
      </p>

      <AdminNav
        organizationId={context.organizationId}
        classroomId={context.classroomId}
        current="pos"
      />

      <section>
        <h2>Point of sale (coming soon)</h2>

        <p>
          Scan a student&apos;s <strong>pay code</strong> (QR on their ID),
          build a cart from catalog items, and confirm the sale.
        </p>

        <ul>
          <li>Only active roster students can be charged.</li>

          <li>
            Pending invitations may scan but cannot be charged until they
            accept.
          </li>

          <li>
            Debits checking first, then sweep from savings if needed. Sales
            decline when funds are insufficient (no negative balances).
          </li>

          <li>
            Students receive a PawKet notification when charged (Slice 10).
          </li>
        </ul>

        <p>
          <em>POS checkout arrives in Slice 8.</em>
        </p>
      </section>

      <p>
        <Link
          to="/admin/$orgId/$classId/store"
          params={{
            orgId: context.organizationId,
            classId: context.classroomId,
          }}
        >
          Student store
        </Link>
      </p>
    </>
  )
}
