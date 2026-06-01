/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as features_auth_authz from "../features/auth/authz.js";
import type * as features_auth_redirect from "../features/auth/redirect.js";
import type * as features_auth_studentApp from "../features/auth/studentApp.js";
import type * as features_auth_studentAuth from "../features/auth/studentAuth.js";
import type * as features_catalog_siteSlug from "../features/catalog/siteSlug.js";
import type * as features_invitations from "../features/invitations.js";
import type * as features_invitations_payToken from "../features/invitations/payToken.js";
import type * as features_invitations_policy from "../features/invitations/policy.js";
import type * as features_organizations from "../features/organizations.js";
import type * as features_roster_roster from "../features/roster/roster.js";
import type * as features_roster_status from "../features/roster/status.js";
import type * as features_settings from "../features/settings.js";
import type * as features_settings_defaults from "../features/settings/defaults.js";
import type * as features_settings_effectiveSettings from "../features/settings/effectiveSettings.js";
import type * as features_settings_merge from "../features/settings/merge.js";
import type * as features_settings_values from "../features/settings/values.js";
import type * as features_tenants from "../features/tenants.js";
import type * as features_tenants_makeTenantsAPI from "../features/tenants/makeTenantsAPI.js";
import type * as features_tenants_roles from "../features/tenants/roles.js";
import type * as features_users from "../features/users.js";
import type * as http from "../http.js";
import type * as schema_schemaFields from "../schema/schemaFields.js";
import type * as seed_catalog from "../seed/catalog.js";
import type * as seed_catalogData from "../seed/catalogData.js";
import type * as seed_catalogSettings from "../seed/catalogSettings.js";
import type * as seed_index from "../seed/index.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "features/auth/authz": typeof features_auth_authz;
  "features/auth/redirect": typeof features_auth_redirect;
  "features/auth/studentApp": typeof features_auth_studentApp;
  "features/auth/studentAuth": typeof features_auth_studentAuth;
  "features/catalog/siteSlug": typeof features_catalog_siteSlug;
  "features/invitations": typeof features_invitations;
  "features/invitations/payToken": typeof features_invitations_payToken;
  "features/invitations/policy": typeof features_invitations_policy;
  "features/organizations": typeof features_organizations;
  "features/roster/roster": typeof features_roster_roster;
  "features/roster/status": typeof features_roster_status;
  "features/settings": typeof features_settings;
  "features/settings/defaults": typeof features_settings_defaults;
  "features/settings/effectiveSettings": typeof features_settings_effectiveSettings;
  "features/settings/merge": typeof features_settings_merge;
  "features/settings/values": typeof features_settings_values;
  "features/tenants": typeof features_tenants;
  "features/tenants/makeTenantsAPI": typeof features_tenants_makeTenantsAPI;
  "features/tenants/roles": typeof features_tenants_roles;
  "features/users": typeof features_users;
  http: typeof http;
  "schema/schemaFields": typeof schema_schemaFields;
  "seed/catalog": typeof seed_catalog;
  "seed/catalogData": typeof seed_catalogData;
  "seed/catalogSettings": typeof seed_catalogSettings;
  "seed/index": typeof seed_index;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  tenants: import("@djpanda/convex-tenants/_generated/component.js").ComponentApi<"tenants">;
  authz: import("@djpanda/convex-authz/_generated/component.js").ComponentApi<"authz">;
};
