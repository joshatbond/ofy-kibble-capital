import { createFileRoute } from '@tanstack/react-router'

import { AdminStorePosPage } from '~/components/admin/store-pos-page'

export const Route = createFileRoute('/admin/$orgId/$classId/store')({
  component: AdminStorePosPage,
})
