import { createFileRoute } from '@tanstack/react-router'

import { StudentLandingSignIn } from '~/components/auth/student-landing-sign-in'

export const Route = createFileRoute('/kibble/landing')({
  component: KibbleLandingPage,
})

function KibbleLandingPage() {
  return (
    <main>
      <h1>Kibble — Landing</h1>

      <p>Unauthenticated marketing page (stub).</p>

      <nav>
        <StudentLandingSignIn app="kibble" />
      </nav>
    </main>
  )
}
