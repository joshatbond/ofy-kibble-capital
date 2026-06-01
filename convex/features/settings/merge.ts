import type { SettingsValues } from './values'

/** Merge settings stack: region → school site → classroom (classroom wins). */
export function mergeSettingsLayers(
  region: SettingsValues,
  site: SettingsValues,
  classroom: Partial<SettingsValues>
): SettingsValues {
  return {
    ...region,
    ...site,
    ...classroom,
  }
}
