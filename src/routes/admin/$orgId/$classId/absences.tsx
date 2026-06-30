import { createFileRoute } from '@tanstack/react-router'

import { AdminAbsencesPage } from '~/components/admin/absences-page'

export const Route = createFileRoute('/admin/$orgId/$classId/absences')({
  component: AdminAbsencesPage,
})
