import { getAuthUserId } from '@convex-dev/auth/server'

import { query } from '../_generated/server'

/** Current signed-in user id, or null when unauthenticated. */
export const viewer = query({
  args: {},
  handler: async ctx => {
    return await getAuthUserId(ctx)
  },
})
