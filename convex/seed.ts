import { v } from 'convex/values'

import { internalMutation } from './_generated/server'
import { seedV1CatalogData } from './lib/catalogSeed'

const seedResultValidator = v.object({
  operatorUserId: v.id('users'),
  regionId: v.id('regions'),
  schoolSiteIds: v.record(v.string(), v.id('schoolSites')),
  classroom: v.object({
    organizationId: v.string(),
    classroomId: v.id('classrooms'),
  }),
})

/**
 * Idempotent dev seed: region `ofysb`, sites `ofysb-mv` / `ofysb-sb1` / `ofysb-sb2`,
 * and one classroom organization on `ofysb-mv`.
 */
export const seedV1Catalog = internalMutation({
  args: {},
  returns: seedResultValidator,
  handler: async ctx => {
    return await seedV1CatalogData(ctx)
  },
})
