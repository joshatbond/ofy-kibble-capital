import { useConvexAuth } from '@convex-dev/auth/react'
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useEffect } from 'react'

import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'
import { adminAppHomePath, adminAppLandingPath } from '~/lib/auth-redirect'

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
  const landingPath = adminAppLandingPath()
  const homePath = adminAppHomePath()
  const isLanding = pathname === landingPath

  const teacherContext = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    isAuthenticated && !isLanding ? {} : 'skip'
  )

  const teacherContextPending =
    isAuthenticated && !isLanding && teacherContext === undefined

  useEffect(() => {
    if (isLoading) return

    if (isLanding && isAuthenticated) {
      void navigate({ to: homePath, replace: true })
      return
    }

    if (!isLanding && !isAuthenticated) {
      void navigate({ to: landingPath, replace: true })
    }
  }, [homePath, isAuthenticated, isLanding, isLoading, landingPath, navigate])

  return (
    <SwitchOn>
      <Case predicate={isLanding}>
        <SwitchOn>
          <Case predicate={isLoading || isAuthenticated}>
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
            <Outlet />
          </Case>
        </SwitchOn>
      </Case>
    </SwitchOn>
  )
}
