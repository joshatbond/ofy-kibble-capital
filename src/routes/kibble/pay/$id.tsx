import { createFileRoute } from '@tanstack/react-router'

import { KibblePaystubDetailPage } from '~/components/kibble/paystub-detail-page'

export const Route = createFileRoute('/kibble/pay/$id')({
  component: KibblePayDetailPage,
})

function KibblePayDetailPage() {
  const params = Route.useParams()
  return <KibblePaystubDetailPage paystubId={params.id} />
}
