import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: AdminIndexPage,
})

function AdminIndexPage() {
  return (
    <main>
      <h1>Admin — Dashboard</h1>

      <p>Main route dashboard (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/admin/landing">Sign out</Link>
          </li>

          <li>
            <Link to="/admin/$orgId" params={{ orgId: 'demo-org' }}>
              Org (demo-org)
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
