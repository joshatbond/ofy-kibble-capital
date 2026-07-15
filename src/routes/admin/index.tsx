import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'

export const Route = createFileRoute('/admin/')({
  component: AdminIndexPage,
})

function AdminIndexPage() {
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    {}
  )

  return (
    <SwitchOn>
      <Case predicate={context === undefined}>
        <p className="p-8">Loading your classroom…</p>
      </Case>

      <Case predicate={context === null}>
        <p className="p-8">No classroom found for your account.</p>
      </Case>

      <Case>
        <AdminIndexRedirect />
      </Case>
    </SwitchOn>
  )
}

function AdminIndexRedirect() {
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    {}
  )

  if (context === undefined || context === null) {
    return null
  }

  return (
    <Navigate
      to="/admin/$orgSlug"
      params={{
        orgSlug: context.orgSlug,
      }}
      replace
    />
  )
}
