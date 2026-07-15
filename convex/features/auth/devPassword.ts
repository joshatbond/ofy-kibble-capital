import { v } from 'convex/values'

import { query } from '../../_generated/server'

import { isLocalDevDeployment } from './devOnly'

/** Whether the deployment exposes Convex Auth password sign-in (local dev only). */
export const isEnabled = query({
  args: {},
  returns: v.boolean(),
  handler: () => isLocalDevDeployment(),
})
