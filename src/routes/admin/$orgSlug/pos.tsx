import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/$orgSlug/pos')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/admin/$orgSlug/store',
      params,
    })
  },
  component: () => null,
})
