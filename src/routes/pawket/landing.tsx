import { createFileRoute } from '@tanstack/react-router'

import { StudentLandingSignIn } from '~/components/auth/student-landing-sign-in'

export const Route = createFileRoute('/pawket/landing')({
  component: PawketLandingPage,
})

function PawketLandingPage() {
  return (
    <main>
      <h1>Pawket — Landing</h1>

      <p>Unauthenticated marketing page (stub).</p>

      <nav>
        <StudentLandingSignIn app="pawket" />
      </nav>
    </main>
  )
}
