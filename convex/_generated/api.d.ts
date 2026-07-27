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
import type * as crons from "../crons.js";
import type * as features_admin_context from "../features/admin/context.js";
import type * as features_auth_authz from "../features/auth/authz.js";
import type * as features_auth_devOnly from "../features/auth/devOnly.js";
import type * as features_auth_devPassword from "../features/auth/devPassword.js";
import type * as features_auth_devPasswordProvider from "../features/auth/devPasswordProvider.js";
import type * as features_auth_redirect from "../features/auth/redirect.js";
import type * as features_auth_studentApp from "../features/auth/studentApp.js";
import type * as features_auth_studentAuth from "../features/auth/studentAuth.js";
import type * as features_auth_teacher from "../features/auth/teacher.js";
import type * as features_banking from "../features/banking.js";
import type * as features_banking_accounts from "../features/banking/accounts.js";
import type * as features_banking_ledger from "../features/banking/ledger.js";
import type * as features_banking_paycheckPipeline from "../features/banking/paycheckPipeline.js";
import type * as features_banking_student from "../features/banking/student.js";
import type * as features_banking_transfers from "../features/banking/transfers.js";
import type * as features_catalog_siteSlug from "../features/catalog/siteSlug.js";
import type * as features_invitations from "../features/invitations.js";
import type * as features_invitations_payToken from "../features/invitations/payToken.js";
import type * as features_invitations_policy from "../features/invitations/policy.js";
import type * as features_notifications from "../features/notifications.js";
import type * as features_notifications_helpers from "../features/notifications/helpers.js";
import type * as features_organizations from "../features/organizations.js";
import type * as features_paySplit from "../features/paySplit.js";
import type * as features_paySplit_helpers from "../features/paySplit/helpers.js";
import type * as features_payroll from "../features/payroll.js";
import type * as features_payroll_dates from "../features/payroll/dates.js";
import type * as features_payroll_periodStore from "../features/payroll/periodStore.js";
import type * as features_payroll_periods from "../features/payroll/periods.js";
import type * as features_roster_cleanup from "../features/roster/cleanup.js";
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
import type * as features_users_profileImage from "../features/users/profileImage.js";
import type * as features_vaults from "../features/vaults.js";
import type * as features_vaults_helpers from "../features/vaults/helpers.js";
import type * as features_vaults_scheduledFunding from "../features/vaults/scheduledFunding.js";
import type * as features_vaultsCron from "../features/vaultsCron.js";
import type * as http from "../http.js";
import type * as lib_displayName from "../lib/displayName.js";
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
  crons: typeof crons;
  "features/admin/context": typeof features_admin_context;
  "features/auth/authz": typeof features_auth_authz;
  "features/auth/devOnly": typeof features_auth_devOnly;
  "features/auth/devPassword": typeof features_auth_devPassword;
  "features/auth/devPasswordProvider": typeof features_auth_devPasswordProvider;
  "features/auth/redirect": typeof features_auth_redirect;
  "features/auth/studentApp": typeof features_auth_studentApp;
  "features/auth/studentAuth": typeof features_auth_studentAuth;
  "features/auth/teacher": typeof features_auth_teacher;
  "features/banking": typeof features_banking;
  "features/banking/accounts": typeof features_banking_accounts;
  "features/banking/ledger": typeof features_banking_ledger;
  "features/banking/paycheckPipeline": typeof features_banking_paycheckPipeline;
  "features/banking/student": typeof features_banking_student;
  "features/banking/transfers": typeof features_banking_transfers;
  "features/catalog/siteSlug": typeof features_catalog_siteSlug;
  "features/invitations": typeof features_invitations;
  "features/invitations/payToken": typeof features_invitations_payToken;
  "features/invitations/policy": typeof features_invitations_policy;
  "features/notifications": typeof features_notifications;
  "features/notifications/helpers": typeof features_notifications_helpers;
  "features/organizations": typeof features_organizations;
  "features/paySplit": typeof features_paySplit;
  "features/paySplit/helpers": typeof features_paySplit_helpers;
  "features/payroll": typeof features_payroll;
  "features/payroll/dates": typeof features_payroll_dates;
  "features/payroll/periodStore": typeof features_payroll_periodStore;
  "features/payroll/periods": typeof features_payroll_periods;
  "features/roster/cleanup": typeof features_roster_cleanup;
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
  "features/users/profileImage": typeof features_users_profileImage;
  "features/vaults": typeof features_vaults;
  "features/vaults/helpers": typeof features_vaults_helpers;
  "features/vaults/scheduledFunding": typeof features_vaults_scheduledFunding;
  "features/vaultsCron": typeof features_vaultsCron;
  http: typeof http;
  "lib/displayName": typeof lib_displayName;
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
