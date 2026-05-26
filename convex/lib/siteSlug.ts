import { v } from 'convex/values'

/** Canonical site slug, e.g. `ofysb-mv`. */
export const siteSlugValidator = v.string()

export function regionSlugFromSiteSlug(siteSlug: string): string {
  const dash = siteSlug.indexOf('-')
  if (dash <= 0) {
    throw new Error(
      `Invalid site slug "${siteSlug}" — expected format {region}-{site}.`
    )
  }
  return siteSlug.slice(0, dash)
}
