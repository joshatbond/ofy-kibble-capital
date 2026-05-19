import { createFileRoute } from '@tanstack/react-router'

import { PawketLandingPage } from '~/components/pawket/landing/pawket-landing-page'

export const Route = createFileRoute('/pawket/')({
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
  component: PawketLandingPage,
})
