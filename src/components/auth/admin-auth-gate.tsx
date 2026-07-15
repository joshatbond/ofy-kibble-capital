import { useConvexAuth } from '@convex-dev/auth/react'
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useEffect } from 'react'

import { AdminShell } from '~/components/admin/admin-shell'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'
import { isScopedAdminPath } from '~/lib/admin-route-context'
import { adminAppHomePath, adminAppLandingPath } from '~/lib/auth-redirect'
import { protectedAdminRouteReturnTo } from '~/lib/admin-auth-redirect'

export function AdminAuthGate() {
  if (!import.meta.env.VITE_CONVEX_URL) return <Outlet />

  return <AdminAuthGateWithConvex />
}

function AdminAuthGateWithConvex() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: state => state.location.pathname,
  })
  const signedOut = useRouterState({
    select: state => {
      const value = state.location.search.signedOut

      return value === true || (typeof value === 'string' && value === 'true')
    },
  })
  const accessDenied = useRouterState({
    select: state => {
      const value = state.location.search.accessDenied

      return value === true || (typeof value === 'string' && value === 'true')
    },
  })
  const landingPath = adminAppLandingPath()
  const homePath = adminAppHomePath()
  const isLanding = pathname === landingPath

  const teacherContext = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    isAuthenticated ? {} : 'skip'
  )

  const teacherContextPending =
    isAuthenticated &&
    teacherContext === undefined &&
    !isScopedAdminPath(pathname)

  useEffect(() => {
    if (isLoading) return

    if (isLanding && isAuthenticated && !signedOut) {
      if (teacherContext === undefined) {
        return
      }

      if (teacherContext === null) {
        if (!accessDenied) {
          void navigate({
            to: landingPath,
            search: { accessDenied: true },
            replace: true,
          })
        }

        return
      }

      void navigate({
        to: '/admin/$orgSlug',
        params: {
          orgSlug: teacherContext.orgSlug,
        },
        replace: true,
      })
      return
    }

    if (!isLanding && !isAuthenticated) {
      void navigate({
        to: landingPath,
        search: {
          returnTo: protectedAdminRouteReturnTo(pathname),
        },
        replace: true,
      })
      return
    }

    if (
      !isLanding &&
      isAuthenticated &&
      teacherContext === null &&
      !teacherContextPending
    ) {
      void navigate({
        to: landingPath,
        search: { accessDenied: true },
        replace: true,
      })
    }
  }, [
    homePath,
    isAuthenticated,
    isLanding,
    isLoading,
    landingPath,
    navigate,
    accessDenied,
    pathname,
    signedOut,
    teacherContext,
    teacherContextPending,
  ])

  return (
    <SwitchOn>
      <Case predicate={isLanding}>
        <SwitchOn>
          <Case
            predicate={
              isLoading ||
              (isAuthenticated && teacherContextPending && !signedOut)
            }
          >
            <p>{isAuthenticated ? 'Redirecting…' : 'Loading…'}</p>
          </Case>

          <Case>
            <Outlet />
          </Case>
        </SwitchOn>
      </Case>

      <Case>
        <SwitchOn>
          <Case predicate={isLoading || teacherContextPending}>
            <p>Loading…</p>
          </Case>

          <Case predicate={!isAuthenticated}>
            <p>Redirecting…</p>
          </Case>

          <Case predicate={teacherContext === null}>
            <main>
              <h1>Teacher access required</h1>

              <p>This area is for teachers only.</p>

              <p>
                <Link to="/kibble">Go to Kibble Capital</Link>
              </p>
            </main>
          </Case>

          <Case>
            <AdminShell>
              <Outlet />
            </AdminShell>
          </Case>
        </SwitchOn>
      </Case>
    </SwitchOn>
  )
}
