import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/$orgId/$classId/pos')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/admin/$orgId/$classId/store',
      params,
    })
  },
  component: () => null,
})
