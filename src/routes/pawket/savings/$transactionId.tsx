import { createFileRoute } from '@tanstack/react-router'

import { PawketTransactionDetailPage } from '~/components/pawket/transaction-detail-page'
import type { Id } from '~/convex/_generated/dataModel'

export const Route = createFileRoute('/pawket/savings/$transactionId')({
  component: PawketSavingsTransactionPage,
})

function PawketSavingsTransactionPage() {
  const { transactionId } = Route.useParams()

  return (
    <PawketTransactionDetailPage
      entryId={transactionId as Id<'ledgerEntries'>}
      backTo="/pawket/savings"
      backLabel="Back to savings"
    />
  )
}
