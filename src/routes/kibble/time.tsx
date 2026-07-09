import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/kibble/time')({
  component: KibbleTimePage,
})

function KibbleTimePage() {
  return (
    <main>
      <h1>Kibble — Time</h1>

      <p>Clock in/out, calendar, quick actions (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/kibble">Dashboard</Link>
          </li>

          <li>
            <Link to="/kibble/landing">Landing</Link>
          </li>

          <li>
            <Link to="/kibble/pay">Pay</Link>
          </li>

          <li>
            <Link to="/kibble/absence">Absence</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
