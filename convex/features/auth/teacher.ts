import { orgScope } from '@djpanda/convex-tenants'

import { authz } from './authz'

import type { MutationCtx, QueryCtx } from '../../_generated/server'

export async function requireTeacherForOrg(
  ctx: TeacherCtx,
  userId: string,
  organizationId: string,
  permission: string
): Promise<void> {
  await authz.require(ctx, userId, permission, orgScope(organizationId))
}
type TeacherCtx = QueryCtx | MutationCtx
