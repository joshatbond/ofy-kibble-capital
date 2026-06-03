import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pawket/landing')({
  component: PawketLandingPage,
})

function PawketLandingPage() {
  return (
    <main>
      <h1>Pawket — Landing</h1>

      <p>Unauthenticated marketing page (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/pawket">Sign in</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
