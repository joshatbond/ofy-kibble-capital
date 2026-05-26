import { useConvexAuth } from '@convex-dev/auth/react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useTeacherAccess } from '~/hooks/use-teacher-access'
import {
  adminHomePath,
  adminLandingPath,
  parseAdminLoadingSearch,
} from '~/lib/admin-auth-redirect'
import {
  hasConvexAuthToken,
  readPendingOAuthRedirectTo,
} from '~/lib/convex-auth-storage'

export const Route = createFileRoute('/admin/loading')({
  validateSearch: parseAdminLoadingSearch,
  beforeLoad: ({ search }) => {
    if (hasConvexAuthToken()) return
    if (search.code !== undefined) return
    if (readPendingOAuthRedirectTo() !== null) return

    throw redirect({
      to: adminLandingPath(),
      replace: true,
    })
  },
  head: () => ({
    meta: [{ title: 'Teacher admin' }],
  }),
  component: AdminLoadingRoute,
})

function AdminLoadingRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const { hasTeacherAccess, isLoading: teacherAccessLoading } =
    useTeacherAccess()

  const dest = search.returnTo ?? adminHomePath()
  const sessionResolved = !authLoading && !teacherAccessLoading

  useEffect(() => {
    if (!sessionResolved) return
    if (!isAuthenticated) {
      void navigate({ to: adminLandingPath(), replace: true })
      return
    }
    if (hasTeacherAccess === false) {
      void navigate({ to: adminLandingPath(), replace: true })
      return
    }
    if (hasTeacherAccess !== true) return

    void navigate({ to: dest, replace: true })
  }, [dest, hasTeacherAccess, isAuthenticated, navigate, sessionResolved])

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      <p className="font-heading text-lg font-semibold">Teacher admin</p>

      <p className="text-muted-foreground text-sm">Signing you in…</p>
    </div>
  )
}
