import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/savings/$transactionId')({
  component: PawketSavingsTransactionPage,
})

function PawketSavingsTransactionPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Pawket — Savings transaction</h1>

      <p>Savings transaction detail (stub).</p>

      <p>
        transactionId: <code>{params.transactionId}</code>
      </p>

      <nav>
        <ul>
          <li>
            <Link to="/pawket">Dashboard</Link>
          </li>

          <li>
            <Link to="/pawket/savings">Savings</Link>
          </li>

          <li>
            <Link to="/pawket/savings/vaults">Vaults</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
