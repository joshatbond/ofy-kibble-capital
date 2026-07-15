import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/kibble/absence/')({
  component: KibbleAbsenceIndexPage,
})

function KibbleAbsenceIndexPage() {
  return (
    <main>
      <h1>Kibble — Absence</h1>

      <p>PTO balance, history, request form (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/kibble">Dashboard</Link>
          </li>

          <li>
            <Link to="/kibble/absence/$id" params={{ id: 'demo-absence' }}>
              Absence request (demo-absence)
            </Link>
          </li>

          <li>
            <Link to="/kibble/time">Time</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
