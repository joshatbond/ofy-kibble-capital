import { createFileRoute } from '@tanstack/react-router'

import { KibbleLandingPage } from '~/components/kibble/landing/kibble-landing-page'

export const Route = createFileRoute('/kibble/')({
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
  component: KibbleLandingPage,
})
