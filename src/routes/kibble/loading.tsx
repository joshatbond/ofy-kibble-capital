import { useConvexAuth } from '@convex-dev/auth/react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { KibbleLoadingScreen } from '~/components/loading/kibble-loader'
import { useCurrentStudentApp } from '~/hooks/use-current-student-app'
import {
  parseStudentLoadingSearch,
  studentAppHomePath,
  studentAppLandingPath,
} from '~/lib/auth-redirect'
import {
  hasConvexAuthToken,
  readPendingOAuthRedirectTo,
} from '~/lib/convex-auth-storage'

export const Route = createFileRoute('/kibble/loading')({
  validateSearch: parseStudentLoadingSearch,
  beforeLoad: ({ search }) => {
    // Allow the route in three cases:
    //   1. The user has a session token (returning user or just-completed
    //      sign-in that already wrote the token).
    //   2. There's an OAuth `code` in the URL — Convex Auth will pick it up
    //      from `window.location.search` on mount, exchange it for tokens,
    //      and the auth state will resolve in-place.
    //   3. An OAuth flow is in progress (sign-in button wrote
    //      `pendingOAuthRedirectTo` to sessionStorage before redirecting to
    //      Google). Required because Convex Auth's `replaceURL` call to strip
    //      the `?code` triggers TanStack Router's patched
    //      `history.replaceState`, which re-runs `beforeLoad` while
    //      `signIn(code)` is still in flight. At that instant the token
    //      isn't stored yet and the code is already gone, so without this
    //      check we'd bounce the user to landing mid-sign-in.
    if (hasConvexAuthToken()) return
    if (search.code !== undefined) return
    if (readPendingOAuthRedirectTo() !== null) return

    throw redirect({
      to: studentAppLandingPath('kibble'),
      replace: true,
    })
  },
  head: () => ({
    meta: [{ title: 'Kibble Capital' }],
  }),
  component: KibbleLoadingRoute,
})

function KibbleLoadingRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const { studentApp, isLoading: sessionLoading } = useCurrentStudentApp()

  const dest = search.returnTo ?? studentAppHomePath('kibble')

  const sessionResolved = !authLoading && !sessionLoading

  // If the user finished resolving auth but is bound to a different app,
  // send them to that app's landing instead of forcing them into /kibble/.
  useEffect(() => {
    if (!sessionResolved) return
    if (!isAuthenticated) return
    if (studentApp === null || studentApp === undefined) return
    if (studentApp === 'kibble') return

    void navigate({
      to: studentAppLandingPath(studentApp),
      replace: true,
    })
  }, [sessionResolved, isAuthenticated, studentApp, navigate])

  const ready = sessionResolved && isAuthenticated && studentApp === 'kibble'

  return (
    <KibbleLoadingScreen
      label="Loading your dashboard…"
      isReady={ready}
      onComplete={() => {
        void navigate({ to: dest, replace: true })
      }}
    />
  )
}
