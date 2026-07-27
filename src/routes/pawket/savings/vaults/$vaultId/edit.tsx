import { createFileRoute } from '@tanstack/react-router'

import { VaultEditPage } from '~/components/pawket/vault-edit-page'

export const Route = createFileRoute('/pawket/savings/vaults/$vaultId/edit')({
  component: PawketVaultEditRoute,
})

function PawketVaultEditRoute() {
  const params = Route.useParams()
  return <VaultEditPage vaultId={params.vaultId} />
}
