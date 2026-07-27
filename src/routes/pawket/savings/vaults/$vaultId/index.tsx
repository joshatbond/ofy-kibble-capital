import { createFileRoute } from '@tanstack/react-router'

import { PawketVaultDetailPage } from '~/components/pawket/vault-detail-page'

export const Route = createFileRoute('/pawket/savings/vaults/$vaultId/')({
  component: PawketVaultDetailRoute,
})

function PawketVaultDetailRoute() {
  const params = Route.useParams()
  return <PawketVaultDetailPage vaultId={params.vaultId} />
}
