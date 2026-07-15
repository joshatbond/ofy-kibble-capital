import { useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { faviconHrefForPathname } from '~/lib/favicon'

export function useFavicon() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  })

  useEffect(() => {
    const href = faviconHrefForPathname(pathname)
    setBrandIconLink('icon', href)
    setBrandIconLink('apple-touch-icon', href)
  }, [pathname])
}
function setBrandIconLink(rel: 'icon' | 'apple-touch-icon', href: string) {
  const selector =
    rel === 'icon'
      ? 'link[rel="icon"][type="image/svg+xml"]'
      : 'link[rel="apple-touch-icon"]'

  const existing = document.querySelector(selector)
  const link =
    existing instanceof HTMLLinkElement
      ? existing
      : document.createElement('link')

  if (!(existing instanceof HTMLLinkElement)) {
    link.rel = rel
    if (rel === 'icon') {
      link.type = 'image/svg+xml'
    }
    document.head.appendChild(link)
  }

  const resolvedHref = new URL(href, window.location.origin).href
  if (link.href === resolvedHref) {
    return
  }

  link.href = href
}
