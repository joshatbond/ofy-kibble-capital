import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AppTheme } from '~/components/theme/app-theme'
import { appThemes } from '~/lib/themes'

export const Route = createFileRoute('/kibble')({
  head: () => ({
    meta: [
      {
        name: 'theme-color',
        content: appThemes.kibble.themeColor,
      },
    ],
  }),
  component: KibbleLayout,
})

function KibbleLayout() {
  return (
    <AppTheme theme="kibble">
      <Outlet />
    </AppTheme>
  )
}
