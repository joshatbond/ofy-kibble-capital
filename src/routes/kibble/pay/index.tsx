import { createFileRoute } from '@tanstack/react-router'

import { KibblePaystubsPage } from '~/components/kibble/paystubs-page'

export const Route = createFileRoute('/kibble/pay/')({
  component: KibblePayIndexPage,
})

function KibblePayIndexPage() {
  return <KibblePaystubsPage />
}
