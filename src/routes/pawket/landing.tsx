import { createFileRoute, redirect } from '@tanstack/react-router'

import { PawketLandingPage } from '~/components/pawket/landing/pawket-landing-page'
import {
  parseStudentLandingSearch,
  studentAppHomePath,
} from '~/lib/auth-redirect'
import { hasConvexAuthToken } from '~/lib/convex-auth-storage'

export const Route = createFileRoute('/pawket/landing')({
  validateSearch: parseStudentLandingSearch,
  beforeLoad: ({ search }) => {
    if (search.signedOut) return

    if (hasConvexAuthToken()) {
      throw redirect({
        to: studentAppHomePath('pawket'),
        replace: true,
      })
    }
  },
  head: () => ({
    meta: [
      { title: 'PawKet Exchange — Master Your Money Like a Pro' },
      {
        name: 'description',
        content:
          'The fun, game-inspired way for students to save, spend, and learn financial skills.',
      },
    ],
  }),
  component: PawketLandingRoute,
})

function PawketLandingRoute() {
  const search = Route.useSearch()

  return <PawketLandingPage returnTo={search.returnTo} />
}
