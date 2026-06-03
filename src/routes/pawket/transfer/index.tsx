import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/transfer/')({
  component: PawketTransferIndexPage,
})

function PawketTransferIndexPage() {
  return (
    <main>
      <h1>Pawket — Transfer</h1>

      <p>Transfer between checking and savings (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/pawket">Dashboard</Link>
          </li>

          <li>
            <Link
              to="/pawket/transfer/$transactionId"
              params={{ transactionId: 'demo-txn' }}
            >
              Transfer (demo-txn)
            </Link>
          </li>

          <li>
            <Link to="/pawket/checking">Checking</Link>
          </li>

          <li>
            <Link to="/pawket/savings">Savings</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
