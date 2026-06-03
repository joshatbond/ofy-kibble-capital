import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/$orgId/$classId/')({
  component: AdminClassPage,
})

function AdminClassPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Admin — Class</h1>

      <p>Class settings / invite users (stub).</p>

      <p>
        orgId: <code>{params.orgId}</code>
      </p>

      <p>
        classId: <code>{params.classId}</code>
      </p>

      <nav>
        <ul>
          <li>
            <Link to="/admin">Dashboard</Link>
          </li>

          <li>
            <Link to="/admin/$orgId" params={{ orgId: params.orgId }}>
              Org
            </Link>
          </li>

          <li>
            <Link
              to="/admin/$orgId/$classId/store"
              params={{ orgId: params.orgId, classId: params.classId }}
            >
              Store
            </Link>
          </li>

          <li>
            <Link
              to="/admin/$orgId/$classId/pos"
              params={{ orgId: params.orgId, classId: params.classId }}
            >
              POS
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
