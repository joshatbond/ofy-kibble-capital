import { createFileRoute } from '@tanstack/react-router'

import { VaultTransferPage } from '~/components/pawket/vault-transfer-page'

export const Route = createFileRoute(
  '/pawket/savings/vaults/$vaultId/transfer'
)({
  component: PawketVaultTransferRoute,
})

function PawketVaultTransferRoute() {
  const params = Route.useParams()
  return <VaultTransferPage vaultId={params.vaultId} />
}
