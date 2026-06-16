import { createFileRoute } from '@tanstack/react-router'

import { StudentSignInButton } from '~/components/auth/student-sign-in-button'

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
            <StudentSignInButton app="kibble" />
          </li>
        </ul>
      </nav>
    </main>
  )
}
