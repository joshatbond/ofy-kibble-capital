import { createFileRoute, redirect } from '@tanstack/react-router'

/** Default entry — product work lives under /kibble and /pawket. */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/kibble' })
  },
})
