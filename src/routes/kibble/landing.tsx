import { createFileRoute, redirect } from '@tanstack/react-router'

import { KibbleLandingPage } from '~/components/kibble/landing/kibble-landing-page'
import {
  parseStudentLandingSearch,
  studentAppHomePath,
} from '~/lib/auth-redirect'
import { hasConvexAuthToken } from '~/lib/convex-auth-storage'

export const Route = createFileRoute('/kibble/landing')({
  validateSearch: parseStudentLandingSearch,
  beforeLoad: ({ search }) => {
    // Sign-out lands here with `?signedOut=true` while Convex Auth is still
    // tearing down the local token. Skip the redirect in that window so the
    // landing renders immediately instead of bouncing us back to the app.
    if (search.signedOut) return

    if (hasConvexAuthToken()) {
      throw redirect({
        to: studentAppHomePath('kibble'),
        replace: true,
      })
    }
  },
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

  return <KibbleLandingPage returnTo={search.returnTo} />
}
