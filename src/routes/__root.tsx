import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import * as React from 'react'

import { useDocumentTitle } from '~/hooks/use-document-title'
import { useFavicon } from '~/hooks/use-favicon'
import { useMobileButtonHaptics } from '~/hooks/use-mobile-button-haptics'
import { formatDocumentTitle } from '~/lib/document-title'
import { faviconHrefForPathname } from '~/lib/favicon'
import appCss from '~/styles/app.css?url'

import type { QueryClient } from '@tanstack/react-query'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        title: formatDocumentTitle('/kibble'),
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: faviconHrefForPathname('/kibble'),
      },
      {
        rel: 'apple-touch-icon',
        href: faviconHrefForPathname('/kibble'),
      },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
})

function RootComponent() {
  useMobileButtonHaptics()
  useDocumentTitle()
  useFavicon()

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>

      <body suppressHydrationWarning>
        {children}

        <Scripts />
      </body>
    </html>
  )
}
