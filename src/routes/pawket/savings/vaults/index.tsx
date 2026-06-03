import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/savings/vaults/')({
  component: PawketVaultsIndexPage,
})

function PawketVaultsIndexPage() {
  return (
    <main>
      <h1>Pawket — Vaults</h1>

      <p>Vaults list (specialized savings accounts, stub).</p>

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
              params={{ vaultId: 'demo-vault' }}
            >
              Vault (demo-vault)
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
