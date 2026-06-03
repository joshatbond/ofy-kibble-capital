import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/$orgId/$classId/store')({
  component: AdminStorePage,
})

function AdminStorePage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Admin — Store</h1>

      <p>Inventory assignment (stub).</p>

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
