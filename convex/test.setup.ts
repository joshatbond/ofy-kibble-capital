/// <reference types="vite/client" />
import authzTest from '@djpanda/convex-authz/test'
import tenantsTest from '@djpanda/convex-tenants/test'
import { convexTest } from 'convex-test'

import schema from './schema'

export const modules = import.meta.glob('./**/*.ts')

/** Fresh in-memory Convex backend with tenants + authz components registered. */
export function initConvexTest() {
  const t = convexTest(schema, modules)
  tenantsTest.register(t, 'tenants')
  authzTest.register(t, 'authz')
  return t
}
