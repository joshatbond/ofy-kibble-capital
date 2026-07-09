import { createFileRoute } from '@tanstack/react-router'

import { PawketCheckingPage } from '~/components/pawket/checking-page'

export const Route = createFileRoute('/pawket/checking/')({
  component: PawketCheckingPage,
})
