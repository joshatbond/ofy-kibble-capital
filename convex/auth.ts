import Google from '@auth/core/providers/google'
import { convexAuth } from '@convex-dev/auth/server'

import { resolveStudentAppRedirect } from './lib/authRedirect'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      return Promise.resolve(resolveStudentAppRedirect(redirectTo))
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
