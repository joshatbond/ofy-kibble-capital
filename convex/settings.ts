import { v } from 'convex/values'

import { internalQuery, query } from './_generated/server'
import {
  resolveEffectiveSettings,
  settingsValuesValidator,
} from './lib/effectiveSettings'

/**
 * Effective settings for a classroom organization (region → site → class snapshot).
 * Public for dev/dashboard inspection; protect with auth when exposing to clients.
 */
export const effectiveSettingsForOrganization = query({
  args: { organizationId: v.string() },
  returns: settingsValuesValidator,
  handler: async (ctx, { organizationId }) => {
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
