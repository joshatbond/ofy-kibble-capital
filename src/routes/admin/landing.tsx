import { createFileRoute } from '@tanstack/react-router'

import { GoogleSignInButton } from '~/components/auth/google-sign-in-button'
import { adminAppRedirectTo } from '~/lib/auth-redirect'

export const Route = createFileRoute('/admin/landing')({
  component: AdminLandingPage,
})

function AdminLandingPage() {
  return (
    <main>
      <h1>Teacher admin</h1>

      <p>
        Invitation-only hub for classroom setup, roster, payroll inputs, and the
        student store.
      </p>

      <ul>
        <li>Invite students and co-teachers</li>

        <li>Manage roster and pay codes</li>

        <li>Configure classroom economy settings</li>

        <li>Run the student store POS (coming soon)</li>
      </ul>

      <p>
        <GoogleSignInButton redirectTo={adminAppRedirectTo()} />
      </p>

      <p>
        <small>
          Sign in with your <code>@ofy.org</code> Google account. Teachers land
          here after accepting a co-teacher invitation.
        </small>
      </p>
    </main>
  )
}
