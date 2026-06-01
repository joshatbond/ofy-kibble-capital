import { createFileRoute } from '@tanstack/react-router'

import { AdminLandingPage } from '~/components/admin/admin-landing-page'
import { parseAdminLandingSearch } from '~/lib/admin-auth-redirect'

export const Route = createFileRoute('/admin/landing')({
  validateSearch: parseAdminLandingSearch,
  head: () => ({
    meta: [{ title: 'Teacher admin — Sign in' }],
  }),
  component: AdminLandingRoute,
})

function AdminLandingRoute() {
  const search = Route.useSearch()

  return (
    <AdminLandingPage
      returnTo={search.returnTo}
      accessDenied={search.accessDenied}
    />
  )
}
