import { useMutation, useQuery } from 'convex/react'
import { Bell } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { For } from '~/components/ui/for'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import { cn } from '~/lib/class-name-merge'

export function PawketNotificationsBell() {
  const unread = useQuery(api.features.notifications.listMyUnreadNotifications)
  const markRead = useMutation(api.features.notifications.markNotificationRead)
  const markAllRead = useMutation(
    api.features.notifications.markAllNotificationsRead
  )

  const count = unread?.length ?? 0
  const pending = unread === undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border-ink bg-card shadow-brutal relative flex size-10 items-center justify-center rounded-lg border-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          aria-label={
            count > 0 ? `Notifications, ${count} unread` : 'Notifications'
          }
        >
          <Bell className="text-primary size-5" aria-hidden />

          {count > 0 ? (
            <span className="bg-destructive text-destructive-foreground border-ink absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[10px] font-extrabold">
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="border-ink bg-card shadow-brutal w-80 rounded-xl border-2 p-0"
      >
        <div className="border-ink flex items-center justify-between gap-2 border-b-2 px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-extrabold">
            Notifications
          </DropdownMenuLabel>

          {count > 0 ? (
            <button
              type="button"
              className="text-primary text-xs font-bold underline-offset-2 hover:underline"
              onClick={() => {
                void markAllRead({})
              }}
            >
              Mark all read
            </button>
          ) : null}
        </div>

        {pending ? (
          <p className="text-muted-foreground px-3 py-6 text-center text-sm">
            Loading…
          </p>
        ) : count === 0 ? (
          <p className="text-muted-foreground px-3 py-6 text-center text-sm">
            You&apos;re all caught up.
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto p-1">
            <For data={unread ?? []} getKey={item => item._id}>
              {item => (
                <NotificationRow
                  notificationId={item._id}
                  title={item.title}
                  body={item.body}
                  createdAt={item.createdAt}
                  onMarkRead={id => {
                    void markRead({ notificationId: id })
                  }}
                />
              )}
            </For>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationRow(props: {
  notificationId: Id<'notifications'>
  title: string
  body: string
  createdAt: number
  onMarkRead: (id: Id<'notifications'>) => void
}) {
  return (
    <DropdownMenuItem
      className={cn(
        'border-ink focus:bg-muted flex cursor-pointer flex-col items-start gap-1 rounded-lg border-0 px-3 py-2.5'
      )}
      onSelect={() => {
        props.onMarkRead(props.notificationId)
      }}
    >
      <span className="text-sm font-bold">{props.title}</span>

      <span className="text-muted-foreground text-xs leading-snug">
        {props.body}
      </span>

      <span className="text-muted-foreground text-[10px] font-medium">
        {formatRelativeTime(props.createdAt)}
      </span>
    </DropdownMenuItem>
  )
}

function formatRelativeTime(createdAt: number): string {
  const deltaMs = Date.now() - createdAt
  const minutes = Math.floor(deltaMs / 60_000)
  if (minutes < 1) {
    return 'Just now'
  }
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
