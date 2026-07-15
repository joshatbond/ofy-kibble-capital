import { createFileRoute } from '@tanstack/react-router'

import { AuthGate } from '~/components/auth/auth-gate'
import { AppTheme } from '~/components/theme/app-theme'
import { studentAppLandingPath } from '~/lib/auth-redirect'
import { pwaManifests } from '~/lib/pwa-manifests'
import { appThemes } from '~/lib/themes'

export const Route = createFileRoute('/kibble')({
  head: () => ({
    meta: [
      {
        name: 'theme-color',
        content: appThemes.kibble.themeColor,
      },
    ],
    links: [
      {
        rel: 'manifest',
        href: pwaManifests.kibble.href,
      },
    ],
  }),
  component: KibbleLayout,
})

function KibbleLayout() {
  return (
    <AppTheme theme="kibble">
      <AuthGate app="kibble" landingPath={studentAppLandingPath('kibble')} />
    </AppTheme>
  )
}
