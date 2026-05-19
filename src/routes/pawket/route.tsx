import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AppTheme } from '~/components/theme/app-theme'
import { appThemes } from '~/lib/themes'

export const Route = createFileRoute('/pawket')({
  head: () => ({
    meta: [
      {
        name: 'theme-color',
        content: appThemes.pawket.themeColor,
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
