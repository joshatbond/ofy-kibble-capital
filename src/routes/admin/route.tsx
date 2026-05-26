import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AppTheme } from '~/components/theme/app-theme'
import { appThemes } from '~/lib/themes'

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [
      {
        name: 'theme-color',
        content: appThemes.admin.themeColor,
      },
    ],
  }),
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <AppTheme theme="admin">
      <Outlet />
    </AppTheme>
  )
}
