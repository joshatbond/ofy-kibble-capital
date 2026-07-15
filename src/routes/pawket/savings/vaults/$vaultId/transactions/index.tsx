import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/pawket/savings/vaults/$vaultId/transactions/'
)({
  component: PawketVaultTransactionsPage,
})

function PawketVaultTransactionsPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Pawket — Vault transactions</h1>

      <p>Vault transactions list (stub).</p>

      <p>
        vaultId: <code>{params.vaultId}</code>
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
            <Link
              to="/pawket/savings/vaults/$vaultId"
              params={{ vaultId: params.vaultId }}
            >
              Vault
            </Link>
          </li>

          <li>
            <Link
              to="/pawket/savings/vaults/$vaultId/transactions/$transactionId"
              params={{ vaultId: params.vaultId, transactionId: 'demo-txn' }}
            >
              Transaction (demo-txn)
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
