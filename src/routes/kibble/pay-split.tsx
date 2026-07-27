import { createFileRoute } from '@tanstack/react-router'

import { PaySplitWizard } from '~/components/kibble/pay-split-wizard'

export const Route = createFileRoute('/kibble/pay-split')({
  component: KibblePaySplitPage,
})

function KibblePaySplitPage() {
  return <PaySplitWizard />
}
