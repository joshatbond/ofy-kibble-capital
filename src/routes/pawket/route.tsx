import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AppTheme } from '~/components/theme/app-theme'
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
      <Outlet />
    </AppTheme>
  )
}
