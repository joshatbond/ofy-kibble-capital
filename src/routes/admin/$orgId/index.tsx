import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/$orgId/')({
  component: AdminOrgPage,
})

function AdminOrgPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Admin — Org</h1>

      <p>Org settings / assign org roles (stub).</p>

      <p>
        orgId: <code>{params.orgId}</code>
      </p>

      <nav>
        <ul>
          <li>
            <Link to="/admin">Dashboard</Link>
          </li>

          <li>
            <Link to="/admin/landing">Landing</Link>
          </li>

          <li>
            <Link
              to="/admin/$orgId/$classId"
              params={{ orgId: params.orgId, classId: 'demo-class' }}
            >
              Class (demo-class)
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
