import { getAuthUserId } from '@convex-dev/auth/server'
import { orgScope } from '@djpanda/convex-tenants'
import { v } from 'convex/values'

import { components } from './_generated/api'
import { mutation } from './_generated/server'
import { authz } from './authz'

/**
 * Create a classroom organization. Disabled for teachers in v1 — only users
 * with `canCreateOrganization` (operator tooling) may call this.
 */
export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    logo: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('You must be signed in to create an organization.')
    }
    const user = await ctx.db.get('users', userId)
    if (!user?.canCreateOrganization) {
      throw new Error(
        'You do not have permission to create organizations. Classrooms are provisioned by an operator.'
      )
    }
    const orgId = await ctx.runMutation(
      components.tenants.organizations.createOrganization,
      {
        userId,
        name: args.name,
        slug: args.slug,
        logo: args.logo,
        metadata: args.metadata,
      }
    )
    await authz.assignRole(
      ctx,
      userId,
      'owner',
      orgScope(orgId),
      undefined,
      userId
    )
    return orgId
  },
})
