import { createFileRoute } from '@tanstack/react-router'

import { PawketTransferPage } from '~/components/pawket/transfer-page'

export const Route = createFileRoute('/pawket/transfer/')({
  component: PawketTransferPage,
})
