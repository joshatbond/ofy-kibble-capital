import { useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { formatDocumentTitle } from '~/lib/document-title'

export function useDocumentTitle() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  })

  useEffect(() => {
    document.title = formatDocumentTitle(pathname)
  }, [pathname])
}
