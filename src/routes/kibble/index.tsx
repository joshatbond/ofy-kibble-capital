import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { SignOutButton } from '~/components/auth/sign-out-button'
import { api } from '~/convex/_generated/api'

export const Route = createFileRoute('/kibble/')({
  component: KibbleIndexPage,
})

function KibbleIndexPage() {
  const unviewed = useQuery(api.features.payroll.countMyUnviewedPaystubs)

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
            <Link
              to="/kibble/pay"
              className="focus-visible:ring-ring inline-flex items-center gap-2 rounded-md focus-visible:ring-3 focus-visible:outline-none"
            >
              Pay
              {unviewed !== undefined && unviewed > 0 ? (
                <span
                  className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                  aria-label={`${String(unviewed)} new paystubs`}
                >
                  {unviewed}
                </span>
              ) : null}
            </Link>
          </li>

          <li>
            <Link to="/kibble/absence">Absence</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}
