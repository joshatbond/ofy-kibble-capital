import { createFileRoute } from '@tanstack/react-router'

import { AdminAbsencesPage } from '~/components/admin/absences-page'

export const Route = createFileRoute('/admin/$orgSlug/absences')({
  component: AdminAbsencesPage,
})
