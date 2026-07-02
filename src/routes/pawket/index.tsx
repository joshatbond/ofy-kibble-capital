import { createFileRoute } from '@tanstack/react-router'

import { PawketDashboardPage } from '~/components/pawket/dashboard-page'

export const Route = createFileRoute('/pawket/')({
  component: PawketDashboardPage,
})
