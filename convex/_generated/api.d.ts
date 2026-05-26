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
import type * as authz from "../authz.js";
import type * as http from "../http.js";
import type * as lib_authRedirect from "../lib/authRedirect.js";
import type * as lib_catalogSeed from "../lib/catalogSeed.js";
import type * as lib_catalogSeedData from "../lib/catalogSeedData.js";
import type * as lib_effectiveSettings from "../lib/effectiveSettings.js";
import type * as lib_effectiveSettingsMerge from "../lib/effectiveSettingsMerge.js";
import type * as lib_makeTenantsAPI from "../lib/makeTenantsAPI.js";
import type * as lib_roles from "../lib/roles.js";
import type * as lib_settingsCatalogSeed from "../lib/settingsCatalogSeed.js";
import type * as lib_settingsDefaults from "../lib/settingsDefaults.js";
import type * as lib_settingsValues from "../lib/settingsValues.js";
import type * as lib_siteSlug from "../lib/siteSlug.js";
import type * as lib_studentApp from "../lib/studentApp.js";
import type * as lib_userFields from "../lib/userFields.js";
import type * as myFunctions from "../myFunctions.js";
import type * as organizations from "../organizations.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as studentAuth from "../studentAuth.js";
import type * as tenants from "../tenants.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authz: typeof authz;
  http: typeof http;
  "lib/authRedirect": typeof lib_authRedirect;
  "lib/catalogSeed": typeof lib_catalogSeed;
  "lib/catalogSeedData": typeof lib_catalogSeedData;
  "lib/effectiveSettings": typeof lib_effectiveSettings;
  "lib/effectiveSettingsMerge": typeof lib_effectiveSettingsMerge;
  "lib/makeTenantsAPI": typeof lib_makeTenantsAPI;
  "lib/roles": typeof lib_roles;
  "lib/settingsCatalogSeed": typeof lib_settingsCatalogSeed;
  "lib/settingsDefaults": typeof lib_settingsDefaults;
  "lib/settingsValues": typeof lib_settingsValues;
  "lib/siteSlug": typeof lib_siteSlug;
  "lib/studentApp": typeof lib_studentApp;
  "lib/userFields": typeof lib_userFields;
  myFunctions: typeof myFunctions;
  organizations: typeof organizations;
  seed: typeof seed;
  settings: typeof settings;
  studentAuth: typeof studentAuth;
  tenants: typeof tenants;
  users: typeof users;
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
