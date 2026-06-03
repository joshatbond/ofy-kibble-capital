import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/kibble/landing')({
  component: KibbleLandingPage,
})

function KibbleLandingPage() {
  return (
    <main>
      <h1>Kibble — Landing</h1>

      <p>Unauthenticated marketing page (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/kibble">Sign in</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
