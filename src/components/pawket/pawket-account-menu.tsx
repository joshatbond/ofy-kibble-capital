import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronUp, LogOut } from 'lucide-react'
import { useState } from 'react'

import { UserAvatar } from '~/components/auth/user-avatar'
import { ViewerNameMenuSection } from '~/components/auth/viewer-name-menu-section'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { studentAppLandingPath } from '~/lib/auth-redirect'
import { cn } from '~/lib/class-name-merge'
import { resolveViewerDisplayName, viewerInitials } from '~/lib/viewer-display'

export function PawketAccountMenu(props: {
  viewerEmail: string
  viewerName: string | undefined
  viewerImage: string | undefined
  layout?: 'icon' | 'footer'
}) {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={layout === 'footer' ? 'default' : 'icon'}
          className={cn(
            layout === 'footer'
              ? 'border-ink hover:bg-muted h-auto w-full justify-start gap-3 rounded-lg border-2 px-3 py-3'
              : 'size-10 rounded-full p-0'
          )}
          aria-label="Open account menu"
        >
          <UserAvatar
            src={props.viewerImage}
            initials={initials}
            size="lg"
            className="border-ink after:border-ink size-10 shrink-0 border-2 shadow-[2px_2px_0_0_var(--ink)]"
            fallbackClassName="bg-primary/10 text-primary text-sm font-bold"
          />

          <SwitchOn>
            <Case predicate={layout === 'footer'}>
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
            </Case>
          </SwitchOn>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        align={layout === 'footer' ? 'start' : 'end'}
        side={layout === 'footer' ? 'top' : 'bottom'}
        sideOffset={layout === 'footer' ? 8 : 4}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{display}</p>

            <p className="text-muted-foreground text-xs leading-none">
              {props.viewerEmail}
            </p>
          </div>
        </DropdownMenuLabel>

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
      void navigate({ to: studentAppLandingPath('pawket') })
    } finally {
      setSignOutPending(false)
    }
  }
}
