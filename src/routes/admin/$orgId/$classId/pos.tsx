import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/$orgId/$classId/pos')({
  component: AdminPosPage,
})

function AdminPosPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Admin — POS</h1>

      <p>Sell items (stub).</p>

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
            <Link
              to="/admin/$orgId/$classId"
              params={{ orgId: params.orgId, classId: params.classId }}
            >
              Class
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
        </ul>
      </nav>
    </main>
  )
}
