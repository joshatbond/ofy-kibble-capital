import { createFileRoute } from '@tanstack/react-router'

import { RedirectAuthenticatedFromLanding } from '~/components/auth/redirect-authenticated-from-landing'
import { KibbleLandingPage } from '~/components/kibble/landing/kibble-landing-page'
import { parseStudentLandingSearch } from '~/lib/auth-redirect'

export const Route = createFileRoute('/kibble/landing')({
  validateSearch: parseStudentLandingSearch,
  head: () => ({
    meta: [
      { title: 'Kibble Capital — Your Professional Earnings Start Here' },
      {
        name: 'description',
        content:
          'Clock in, track hours, and understand your school-based earnings with transparent pay stubs and a unified student dashboard.',
      },
    ],
  }),
  component: KibbleLandingRoute,
})

function KibbleLandingRoute() {
  const search = Route.useSearch()

  return (
    <RedirectAuthenticatedFromLanding app="kibble">
      <KibbleLandingPage returnTo={search.returnTo} />
    </RedirectAuthenticatedFromLanding>
  )
}
