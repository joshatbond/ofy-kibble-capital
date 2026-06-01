import { useConvexAuth } from '@convex-dev/auth/react'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { StudentSessionLoading } from '~/components/auth/student-session-loading'
import {
  hasConvexAuthToken,
  readPendingOAuthRedirectTo,
} from '~/lib/convex-auth-storage'
import {
  invitePath,
  parseInviteLoadingSearch,
} from '~/lib/invite-auth-redirect'

export const Route = createFileRoute('/invite/$invitationId/loading')({
  validateSearch: parseInviteLoadingSearch,
  beforeLoad: ({ params, search }) => {
    if (hasConvexAuthToken()) return
    if (search.code !== undefined) return
    if (readPendingOAuthRedirectTo() !== null) return

    throw redirect({
      to: invitePath(params.invitationId),
      replace: true,
    })
  },
  head: () => ({
    meta: [{ title: 'Signing in…' }],
  }),
  component: InviteLoadingRoute,
})

function InviteLoadingRoute() {
  const { invitationId } = Route.useParams()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()

  return (
    <StudentSessionLoading
      app="kibble"
      label="Finishing sign-in…"
      isReady={!authLoading && isAuthenticated}
      onComplete={() => {
        window.location.replace(invitePath(invitationId))
      }}
    />
  )
}
