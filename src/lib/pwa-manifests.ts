import { appThemes } from '~/lib/themes'

/** Web App Manifest paths scoped per student PWA surface. */
export const pwaManifests = {
  kibble: {
    href: '/manifest-kibble.webmanifest',
    themeColor: appThemes.kibble.themeColor,
  },
  pawket: {
    href: '/manifest-pawket.webmanifest',
    themeColor: appThemes.pawket.themeColor,
  },
} as const
