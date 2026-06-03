import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/landing')({
  component: AdminLandingPage,
})

function AdminLandingPage() {
  return (
    <main>
      <h1>Admin — Landing</h1>

      <p>Unauthenticated landing (stub).</p>

      <nav>
        <ul>
          <li>
            <Link to="/admin">Sign in</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
