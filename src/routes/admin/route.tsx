import { createFileRoute } from '@tanstack/react-router'

import { AdminAuthGate } from '~/components/auth/admin-auth-gate'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  return <AdminAuthGate />
}
