import { createFileRoute } from '@tanstack/react-router'

import { AdminAuthGate } from '~/components/auth/admin-auth-gate'
import { AppTheme } from '~/components/theme/app-theme'
import { appThemes } from '~/lib/themes'

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [
      {
        name: 'theme-color',
        content: appThemes.kibble.themeColor,
      },
    ],
  }),
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <AppTheme theme="kibble">
      <AdminAuthGate />
    </AppTheme>
  )
}
