import { Authz, definePermissions, defineRoles } from '@djpanda/convex-authz'
import { TENANTS_PERMISSIONS, TENANTS_ROLES } from '@djpanda/convex-tenants'

import { components } from './_generated/api'
import { APP_ROLES } from './lib/roles'

const permissions = definePermissions(TENANTS_PERMISSIONS, {})

const roles = defineRoles(permissions, TENANTS_ROLES, APP_ROLES)

export const authz = new Authz(components.authz, { permissions, roles })
