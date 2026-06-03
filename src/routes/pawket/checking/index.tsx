import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/checking/')({
  component: PawketCheckingIndexPage,
})

function PawketCheckingIndexPage() {
  return (
    <main>
      <h1>Pawket — Checking</h1>

      <p>Checking account dashboard (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/pawket">Dashboard</Link>
          </li>

          <li>
            <Link
              to="/pawket/checking/$transactionId"
              params={{ transactionId: 'demo-txn' }}
            >
              Transaction (demo-txn)
            </Link>
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
