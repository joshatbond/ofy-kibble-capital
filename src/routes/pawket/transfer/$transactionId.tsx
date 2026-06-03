import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/transfer/$transactionId')({
  component: PawketTransferDetailPage,
})

function PawketTransferDetailPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Pawket — Transfer detail</h1>

      <p>Transfer detail (stub).</p>

      <p>
        transactionId: <code>{params.transactionId}</code>
      </p>

      <nav>
        <ul>
          <li>
            <Link to="/pawket">Dashboard</Link>
          </li>

          <li>
            <Link to="/pawket/transfer">Transfer list</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
