import { createFileRoute } from '@tanstack/react-router'

import { PawketLandingPage } from '~/components/pawket/landing/pawket-landing-page'
import { parseStudentLandingSearch } from '~/lib/auth-redirect'

export const Route = createFileRoute('/pawket/landing')({
  validateSearch: parseStudentLandingSearch,
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
