import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/kibble/pay/')({
  component: KibblePayIndexPage,
})

function KibblePayIndexPage() {
  return (
    <main>
      <h1>Kibble — Pay</h1>

      <p>Pay stub list (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/kibble">Dashboard</Link>
          </li>

          <li>
            <Link to="/kibble/pay/$id" params={{ id: 'demo-paystub' }}>
              Pay stub (demo-paystub)
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
