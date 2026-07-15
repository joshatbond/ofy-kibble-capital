import { rosterStatusValidator } from '../../schema/schemaFields'

import type { Infer } from 'convex/values'

export { rosterStatusValidator }

export type RosterStatus = Infer<typeof rosterStatusValidator>
