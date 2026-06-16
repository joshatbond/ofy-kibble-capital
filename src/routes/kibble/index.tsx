import { Link, createFileRoute } from '@tanstack/react-router'

import { SignOutButton } from '~/components/auth/sign-out-button'

export const Route = createFileRoute('/kibble/')({
  component: KibbleIndexPage,
})

function KibbleIndexPage() {
  return (
    <main>
      <h1>Kibble — Dashboard</h1>

      <p>Overview of recent activity (stub).</p>

      <nav>
        <ul>
          <li>
            <SignOutButton landingTo="/kibble/landing" />
          </li>

          <li>
            <Link to="/kibble/time">Time</Link>
          </li>

          <li>
            <Link to="/kibble/pay">Pay</Link>
          </li>

          <li>
            <Link to="/kibble/absence">Absence</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
