import { createFileRoute } from '@tanstack/react-router'

import { AuthGate } from '~/components/auth/auth-gate'
import { PawketShell } from '~/components/pawket/pawket-shell'
import { AppTheme } from '~/components/theme/app-theme'
import { studentAppLandingPath } from '~/lib/auth-redirect'
import { pwaManifests } from '~/lib/pwa-manifests'
import { appThemes } from '~/lib/themes'

export const Route = createFileRoute('/pawket')({
  head: () => ({
    meta: [
      {
        name: 'theme-color',
        content: appThemes.pawket.themeColor,
      },
    ],
    links: [
      {
        rel: 'manifest',
        href: pwaManifests.pawket.href,
      },
    ],
  }),
  component: PawketLayout,
})

function PawketLayout() {
  return (
    <AppTheme theme="pawket">
      <AuthGate
        app="pawket"
        landingPath={studentAppLandingPath('pawket')}
        authenticatedShell={children => <PawketShell>{children}</PawketShell>}
      />
    </AppTheme>
  )
}
