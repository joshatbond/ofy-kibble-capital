import { createFileRoute, redirect } from '@tanstack/react-router'

import { AdminLandingPage } from '~/components/admin/admin-landing-page'
import {
  adminHomePath,
  parseAdminLandingSearch,
} from '~/lib/admin-auth-redirect'
import { hasConvexAuthToken } from '~/lib/convex-auth-storage'

export const Route = createFileRoute('/admin/landing')({
  validateSearch: parseAdminLandingSearch,
  beforeLoad: ({ search }) => {
    if (search.signedOut) return

    if (hasConvexAuthToken()) {
      throw redirect({
        to: adminHomePath(),
        replace: true,
      })
    }
  },
  head: () => ({
    meta: [{ title: 'Teacher admin — Sign in' }],
  }),
  component: AdminLandingRoute,
})

function AdminLandingRoute() {
  const search = Route.useSearch()

  return <AdminLandingPage returnTo={search.returnTo} />
}
