import { createFileRoute } from '@tanstack/react-router'

import { AuthGate } from '~/components/auth/auth-gate'
import { studentAppLandingPath } from '~/lib/auth-redirect'

export const Route = createFileRoute('/kibble')({
  component: KibbleLayout,
})

function KibbleLayout() {
  return (
    <AuthGate app="kibble" landingPath={studentAppLandingPath('kibble')} />
  )
}
