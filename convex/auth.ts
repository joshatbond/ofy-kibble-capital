import { convexAuth } from '@convex-dev/auth/server'

import { authProvidersForDeployment } from './features/auth/devPasswordProvider'
import { resolvePostAuthRedirect } from './features/auth/redirect'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: authProvidersForDeployment(),
  callbacks: {
    async redirect({ redirectTo }) {
      return Promise.resolve(resolvePostAuthRedirect(redirectTo))
    },
  },
  jwt: {
    async customClaims(ctx, { sessionId }) {
      const session = await ctx.db.get('authSessions', sessionId)

      if (session?.studentApp === undefined) {
        return {}
      }

      return { studentApp: session.studentApp }
    },
  },
})
