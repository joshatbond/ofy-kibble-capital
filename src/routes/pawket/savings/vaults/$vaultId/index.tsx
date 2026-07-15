import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/savings/vaults/$vaultId/')({
  component: PawketVaultDetailPage,
})

function PawketVaultDetailPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Pawket — Vault</h1>

      <p>Vault detail (stub).</p>

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
            <Link to="/pawket/savings/vaults">Vaults</Link>
          </li>

          <li>
            <Link
              to="/pawket/savings/vaults/$vaultId/transactions"
              params={{ vaultId: params.vaultId }}
            >
              Transactions
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
