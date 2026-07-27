import { createFileRoute } from '@tanstack/react-router'

import { VaultSetupWizard } from '~/components/pawket/vault-setup-wizard'

export const Route = createFileRoute('/pawket/savings/vaults/setup')({
  component: PawketVaultSetupPage,
})

function PawketVaultSetupPage() {
  return <VaultSetupWizard />
}
