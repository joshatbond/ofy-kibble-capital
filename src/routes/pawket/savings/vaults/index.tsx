import { createFileRoute } from '@tanstack/react-router'

import { PawketVaultsListPage } from '~/components/pawket/vaults-list-page'

export const Route = createFileRoute('/pawket/savings/vaults/')({
  component: PawketVaultsIndexPage,
})

function PawketVaultsIndexPage() {
  return <PawketVaultsListPage />
}
