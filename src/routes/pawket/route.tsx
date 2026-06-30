import { createFileRoute } from '@tanstack/react-router'

import { AuthGate } from '~/components/auth/auth-gate'
import { studentAppLandingPath } from '~/lib/auth-redirect'

export const Route = createFileRoute('/pawket')({
  component: PawketLayout,
})

function PawketLayout() {
  return <AuthGate app="pawket" landingPath={studentAppLandingPath('pawket')} />
}
