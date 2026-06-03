import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/savings/')({
  component: PawketSavingsIndexPage,
})

function PawketSavingsIndexPage() {
  return (
    <main>
      <h1>Pawket — Savings</h1>

      <p>Savings account dashboard (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/pawket">Dashboard</Link>
          </li>

          <li>
            <Link
              to="/pawket/savings/$transactionId"
              params={{ transactionId: 'demo-txn' }}
            >
              Transaction (demo-txn)
            </Link>
          </li>

          <li>
            <Link to="/pawket/savings/vaults">Vaults</Link>
          </li>

          <li>
            <Link to="/pawket/checking">Checking</Link>
          </li>

          <li>
            <Link to="/pawket/transfer">Transfer</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
