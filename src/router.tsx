import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'

import { routeTree } from './routeTree.gen'

export function getRouter() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL

  if (!convexUrl) {
    if (import.meta.env.PROD) {
      console.error(
        'VITE_CONVEX_URL is missing. Netlify builds need CONVEX_DEPLOY_KEY and `bunx convex deploy --cmd "bun run build"`.'
      )
    }

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: 5000,
        },
      },
    })

    return routerWithQueryClient(
      createRouter({
        routeTree,
        defaultPreload: 'intent',
        context: { queryClient },
        scrollRestoration: true,
        defaultPreloadStaleTime: 0,
        defaultErrorComponent: err => <p>{err.error.stack}</p>,
        defaultNotFoundComponent: () => <p>not found</p>,
      }),
      queryClient
    )
  }

  const convexQueryClient = new ConvexQueryClient(convexUrl)

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: 'intent',
      context: { queryClient },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
      defaultErrorComponent: err => <p>{err.error.stack}</p>,
      defaultNotFoundComponent: () => <p>not found</p>,
      Wrap: ({ children }) => (
        <ConvexAuthProvider
          client={convexQueryClient.convexClient}
          replaceURL={relativeUrl => {
            const url = new URL(relativeUrl, window.location.origin)
            window.history.replaceState(
              {},
              '',
              `${url.pathname}${url.search}${url.hash}`
            )
          }}
        >
          {children}
        </ConvexAuthProvider>
      ),
    }),
    queryClient
  )

  return router
}
