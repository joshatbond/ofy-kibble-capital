import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/kibble/absence/$id')({
  component: KibbleAbsenceDetailPage,
})

function KibbleAbsenceDetailPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Kibble — Absence request</h1>

      <p>Absence request details (stub).</p>

      <p>
        id: <code>{params.id}</code>
      </p>

      <nav>
        <ul>
          <li>
            <Link to="/kibble">Dashboard</Link>
          </li>

          <li>
            <Link to="/kibble/absence">Absence list</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
