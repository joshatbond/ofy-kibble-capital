import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/checking/$transactionId')({
  component: PawketCheckingTransactionPage,
})

function PawketCheckingTransactionPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Pawket — Checking transaction</h1>

      <p>Checking transaction detail (stub).</p>

      <p>
        transactionId: <code>{params.transactionId}</code>
      </p>

      <nav>
        <ul>
          <li>
            <Link to="/pawket">Dashboard</Link>
          </li>

          <li>
            <Link to="/pawket/checking">Checking</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
