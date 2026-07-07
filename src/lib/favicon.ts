const FAVICON_PATHS = {
  kibble: '/favicons/kibble.svg',
  pawket: '/favicons/pawket.svg',
} as const
export function faviconIdForPathname(pathname: string): AppFaviconId {
  if (pathname.startsWith('/pawket')) {
    return 'pawket'
  }

  return 'kibble'
}
export function faviconHrefForPathname(pathname: string): string {
  return FAVICON_PATHS[faviconIdForPathname(pathname)]
}
export type AppFaviconId = keyof typeof FAVICON_PATHS
