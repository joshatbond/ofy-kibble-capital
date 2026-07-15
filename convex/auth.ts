import { convexAuth } from '@convex-dev/auth/server'

import { internal } from './_generated/api'
import { authProvidersForDeployment } from './features/auth/devPasswordProvider'
import { resolvePostAuthRedirect } from './features/auth/redirect'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: authProvidersForDeployment(),
  callbacks: {
    async redirect({ redirectTo }) {
      return Promise.resolve(resolvePostAuthRedirect(redirectTo))
    },
    async afterUserCreatedOrUpdated(ctx, { userId, profile, type }) {
      if (type !== 'oauth') {
        return
      }

      const image =
        typeof profile.image === 'string' ? profile.image : undefined

      if (!image?.includes('googleusercontent.com')) {
        return
      }

      await ctx.scheduler.runAfter(
        0,
        internal.features.users.profileImage.syncProfileImageFromUrl,
        {
          userId,
          sourceUrl: image,
        }
      )
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
