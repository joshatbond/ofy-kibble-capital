import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/invite/$invitationId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/invite/$invitationId"!</div>
}
