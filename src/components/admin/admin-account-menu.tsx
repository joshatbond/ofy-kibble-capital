import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronUp, LogOut } from 'lucide-react'
import { useState } from 'react'

import type { AdminNavTab } from '~/components/admin/admin-shell'
import { UserAvatar } from '~/components/auth/user-avatar'
import { ViewerNameMenuSection } from '~/components/auth/viewer-name-menu-section'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { Id } from '~/convex/_generated/dataModel'
import { classroomSelectValue } from '~/lib/admin-route-context'
import { adminAppLandingPath } from '~/lib/auth-redirect'
import { cn } from '~/lib/class-name-merge'
import { resolveViewerDisplayName, viewerInitials } from '~/lib/viewer-display'

export function AdminAccountMenu(props: AdminAccountMenuProps) {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  const [signOutPending, setSignOutPending] = useState(false)
  const layout = props.layout ?? 'icon'

  const display = resolveViewerDisplayName({
    name: props.viewerName,
    email: props.viewerEmail,
  })
  const initials = viewerInitials({
    email: props.viewerEmail,
    name: props.viewerName,
  })
  const selectedClassroom = props.classrooms.find(
    classroom =>
      classroom.organizationId === props.currentOrganizationId &&
      classroom.classroomId === props.currentClassroomId
  )
  const currentValue =
    selectedClassroom !== undefined
      ? classroomSelectValue(selectedClassroom)
      : undefined
  const classroomForSelect = selectedClassroom ?? props.classrooms.at(0)
  const schoolSelectValue =
    classroomForSelect !== undefined
      ? classroomSelectValue(classroomForSelect)
      : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={layout === 'sidebar' ? 'default' : 'icon'}
          className={cn(
            layout === 'sidebar'
              ? 'border-ink hover:bg-muted h-auto w-full justify-start gap-3 rounded-lg border-2 px-3 py-3'
              : 'size-10 rounded-full p-0'
          )}
          aria-label="Open account menu"
        >
          <UserAvatar
            src={props.viewerImage}
            initials={initials}
            size="lg"
            className="border-ink after:border-ink size-10 shrink-0 border-2"
            fallbackClassName="border-ink bg-secondary text-secondary-foreground text-sm font-bold"
          />

          {layout === 'sidebar' ? (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-bold">{display}</p>

                <p className="text-muted-foreground truncate text-xs">
                  {props.viewerEmail}
                </p>
              </div>

              <ChevronUp
                className="text-muted-foreground size-5 shrink-0"
                aria-hidden
              />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        align={layout === 'sidebar' ? 'start' : 'end'}
        side={layout === 'sidebar' ? 'top' : 'bottom'}
        sideOffset={layout === 'sidebar' ? 8 : 4}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{display}</p>

            <p className="text-muted-foreground text-xs leading-none">
              {props.viewerEmail}
            </p>
          </div>
        </DropdownMenuLabel>

        {props.classrooms.length > 1 && schoolSelectValue !== undefined ? (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Classroom
            </DropdownMenuLabel>

            <div
              className="px-2 py-1.5"
              onPointerDown={event => event.stopPropagation()}
              onClick={event => event.stopPropagation()}
            >
              <Select
                value={schoolSelectValue}
                onValueChange={value => {
                  if (value === currentValue) {
                    return
                  }

                  const next = props.classrooms.find(
                    classroom => classroomSelectValue(classroom) === value
                  )
                  if (next === undefined) {
                    return
                  }

                  const path = adminPathForTab(props.currentTab, next)
                  void navigate(path)
                }}
              >
                <SelectTrigger className="h-9 w-full" aria-label="Classroom">
                  <SelectValue placeholder="Classroom" />
                </SelectTrigger>

                <SelectContent position="popper" className="z-100">
                  {props.classrooms.map(classroom => (
                    <SelectItem
                      key={classroomSelectValue(classroom)}
                      value={classroomSelectValue(classroom)}
                    >
                      {classroom.classroomName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <ViewerNameMenuSection viewerName={props.viewerName} />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={signOutPending}
          onSelect={() => {
            void handleSignOut()
          }}
        >
          <LogOut className="size-4 shrink-0" />

          {signOutPending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  async function handleSignOut() {
    setSignOutPending(true)

    try {
      await signOut()
      void navigate({ to: adminAppLandingPath() })
    } finally {
      setSignOutPending(false)
    }
  }
}
export type AdminAccountMenuProps = {
  viewerEmail: string
  viewerName: string | undefined
  viewerImage: string | undefined
  classrooms: Array<TeacherClassroom>
  currentOrganizationId: string
  currentClassroomId: Id<'classrooms'>
  currentTab: AdminNavTab
  layout?: 'icon' | 'sidebar'
}
function adminPathForTab(
  tab: AdminNavTab,
  classroom: TeacherClassroom
): { to: string; params: Record<string, string> } {
  const params = { orgSlug: classroom.orgSlug }

  switch (tab) {
    case 'settings':
      return { to: '/admin/$orgSlug/settings', params }
    case 'absences':
      return { to: '/admin/$orgSlug/absences', params }
    case 'store':
      return { to: '/admin/$orgSlug/store', params }
    default:
      return { to: '/admin/$orgSlug', params }
  }
}
type TeacherClassroom = {
  organizationId: string
  organizationName: string
  classroomId: Id<'classrooms'>
  classroomName: string
  orgSlug: string
  siteSlug: string
}
