import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/pawket/savings/vaults/$vaultId/transactions/$transactionId'
)({
  component: PawketVaultTransactionDetailPage,
})

function PawketVaultTransactionDetailPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Pawket — Vault transaction</h1>

      <p>Vault transaction detail (stub).</p>

      <p>
        vaultId: <code>{params.vaultId}</code>
      </p>

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
            <Link
              to="/pawket/savings/vaults/$vaultId/transactions"
              params={{ vaultId: params.vaultId }}
            >
              Transactions
            </Link>
          </li>

          <li>
            <Link
              to="/pawket/savings/vaults/$vaultId"
              params={{ vaultId: params.vaultId }}
            >
              Vault
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
