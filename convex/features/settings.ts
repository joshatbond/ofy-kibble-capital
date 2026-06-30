import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { internalQuery, query } from '../_generated/server'

import { requireTeacherForOrg } from './auth/teacher'
import {
  resolveEffectiveSettings,
  settingsValuesValidator,
} from './settings/effectiveSettings'

/**
 * Effective settings for a classroom organization (region → site → class snapshot).
 * Teachers only.
 */
export const effectiveSettingsForOrganization = query({
  args: { organizationId: v.string() },
  returns: settingsValuesValidator,
  handler: async (ctx, { organizationId }) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      organizationId,
      'organizations:read'
    )

    return await resolveEffectiveSettings(ctx, organizationId)
  },
})

/** Same as {@link effectiveSettingsForOrganization}, for `convex run` / scripts. */
export const effectiveSettingsForOrganizationInternal = internalQuery({
  args: { organizationId: v.string() },
  returns: settingsValuesValidator,
  handler: async (ctx, { organizationId }) => {
    return await resolveEffectiveSettings(ctx, organizationId)
  },
})
