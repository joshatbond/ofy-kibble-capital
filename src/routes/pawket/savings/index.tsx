import { createFileRoute } from '@tanstack/react-router'

import { PawketSavingsPage } from '~/components/pawket/savings-page'

export const Route = createFileRoute('/pawket/savings/')({
  component: PawketSavingsPage,
})
