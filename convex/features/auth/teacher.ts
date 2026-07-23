import { orgScope } from '@djpanda/convex-tenants'

import { components } from '../../_generated/api'
import { isTeacherMemberRole } from '../tenants/roles'

import { authz } from './authz'

import type { MutationCtx, QueryCtx } from '../../_generated/server'

export async function requireTeacherForOrg(
  ctx: TeacherCtx,
  userId: string,
  organizationId: string,
  permission: string
): Promise<void> {
  const member = await ctx.runQuery(components.tenants.members.getMember, {
    organizationId,
    userId,
  })

  if (member === null || !isTeacherMemberRole(member.role)) {
    throw new Error('Teacher access required')
  }

  await authz.require(ctx, userId, permission, orgScope(organizationId))
}
type TeacherCtx = QueryCtx | MutationCtx
