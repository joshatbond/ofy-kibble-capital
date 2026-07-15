import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { internalQuery, mutation, query } from '../_generated/server'

import { requireTeacherForOrg } from './auth/teacher'
import {
  ensureClassSettingsSnapshot,
  getClassroomByOrganizationId,
  resolveEffectiveSettings,
  settingsValuesValidator,
} from './settings/effectiveSettings'
import { assertClassSettings, pickSettingsValues } from './settings/values'

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

/**
 * Persist classroom-level settings for a teacher's organization.
 * Creates a `classSettings` snapshot on first save when one does not exist.
 */
export const updateClassSettingsForOrganization = mutation({
  args: {
    organizationId: v.string(),
    settings: settingsValuesValidator,
  },
  returns: settingsValuesValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'organizations:update'
    )

    const classroom = await getClassroomByOrganizationId(
      ctx,
      args.organizationId
    )
    if (!classroom) {
      throw new Error(`No classroom for organization "${args.organizationId}".`)
    }

    const values = pickSettingsValues(args.settings)
    assertClassSettings(values)

    const classSettingsId = await ensureClassSettingsSnapshot(ctx, {
      organizationId: args.organizationId,
      classroomId: classroom._id,
      siteSlug: classroom.siteSlug,
    })

    await ctx.db.patch('classSettings', classSettingsId, values)

    return values
  },
})
