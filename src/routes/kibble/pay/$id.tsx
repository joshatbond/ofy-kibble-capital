import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/kibble/pay/$id')({
  component: KibblePayDetailPage,
})

function KibblePayDetailPage() {
  const params = Route.useParams()

  return (
    <main>
      <h1>Kibble — Pay stub</h1>

      <p>Pay stub breakdown (stub).</p>

      <p>
        id: <code>{params.id}</code>
      </p>

      <nav>
        <ul>
          <li>
            <Link to="/kibble">Dashboard</Link>
          </li>

          <li>
            <Link to="/kibble/pay">Pay list</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
