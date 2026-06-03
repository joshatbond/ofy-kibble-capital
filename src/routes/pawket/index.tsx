import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/')({
  component: PawketIndexPage,
})

function PawketIndexPage() {
  return (
    <main>
      <h1>Pawket — Dashboard</h1>

      <p>Balances and recent activity (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/pawket/landing">Sign out</Link>
          </li>

          <li>
            <Link to="/pawket/checking">Checking</Link>
          </li>

          <li>
            <Link to="/pawket/savings">Savings</Link>
          </li>

          <li>
            <Link to="/pawket/transfer">Transfer</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
