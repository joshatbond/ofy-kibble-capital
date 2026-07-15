import { Link, useRouterState } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Bell, Home, PiggyBank, Wallet } from 'lucide-react'

import { PawketOfflineBanner } from '~/components/pawket/offline-banner'
import { PawketAccountMenu } from '~/components/pawket/pawket-account-menu'
import { AppTheme } from '~/components/theme/app-theme'
import { For } from '~/components/ui/for'
import { api } from '~/convex/_generated/api'
import { useNavTabIndicator } from '~/hooks/use-nav-tab-indicator'
import { useOnlineStatus } from '~/hooks/use-online-status'
import { cn } from '~/lib/class-name-merge'
import {
  isPawketTransactionDetail,
  isPawketTransferOverlay,
  pawketNavTab,
  pawketShellTitle,
} from '~/lib/pawket-nav'
import type { PawketNavTab } from '~/lib/pawket-nav'

import type { LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

export function PawketShell(props: { children: ReactNode }) {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  })
  const currentTab = pawketNavTab(pathname)
  const hideBottomNav =
    isPawketTransactionDetail(pathname) || isPawketTransferOverlay(pathname)
  const hideTopBar = isPawketTransferOverlay(pathname)
  const profile = useQuery(api.features.users.viewerProfile)
  const accountMenu = profileToAccountMenu(profile)
  const isOnline = useOnlineStatus()

  return (
    <AppTheme
      theme="pawket"
      className="bg-background text-foreground min-h-dvh pb-24"
    >
      <PawketOfflineBanner isOnline={isOnline} />

      {hideTopBar ? null : (
        <PawketTopBar
          title={pawketShellTitle(pathname)}
          accountMenu={accountMenu}
          accountMenuPending={profile === undefined}
        />
      )}

      <div
        className={cn('mx-auto w-full max-w-2xl', hideTopBar && 'max-w-none')}
      >
        {props.children}
      </div>

      {hideBottomNav ? null : (
        <PawketBottomNav current={currentTab ?? 'home'} />
      )}
    </AppTheme>
  )
}

function PawketTopBar(props: {
  title: string
  accountMenu: ComponentProps<typeof PawketAccountMenu> | null
  accountMenuPending: boolean
}) {
  return (
    <header className="border-ink bg-background shadow-brutal sticky top-0 z-40 flex items-center justify-between border-b-2 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {props.accountMenu ? (
          <PawketAccountMenu {...props.accountMenu} layout="icon" />
        ) : (
          <AccountMenuPlaceholder pending={props.accountMenuPending} />
        )}

        <span className="font-heading text-primary truncate text-lg font-extrabold">
          {props.title}
        </span>
      </div>

      <button
        type="button"
        className="border-ink bg-card shadow-brutal flex size-10 items-center justify-center rounded-lg border-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        aria-label="Notifications"
      >
        <Bell className="text-primary size-5" aria-hidden />
      </button>
    </header>
  )
}

function PawketBottomNav(props: { current: PawketNavTab }) {
  const tabs = [
    {
      tab: 'home' as const,
      to: '/pawket' as const,
      label: 'Home',
      icon: Home,
    },
    {
      tab: 'checking' as const,
      to: '/pawket/checking' as const,
      label: 'Checking',
      icon: Wallet,
    },
    {
      tab: 'savings' as const,
      to: '/pawket/savings' as const,
      label: 'Savings',
      icon: PiggyBank,
    },
  ] as const

  const { navRef, indicatorRef, indicatorReady } = useNavTabIndicator({
    current: props.current,
    orientation: 'horizontal',
  })

  return (
    <nav
      ref={navRef}
      className="border-ink bg-card fixed inset-x-0 bottom-0 z-50 grid h-20 grid-cols-3 gap-1 border-t-2 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_0_0_var(--ink)]"
    >
      <span
        ref={indicatorRef}
        aria-hidden
        className={cn(
          'border-ink bg-accent pointer-events-none absolute rounded-xl border-2',
          !indicatorReady && 'opacity-0'
        )}
      />

      <For data={tabs} getKey={tab => tab.tab}>
        {tab => (
          <PawketBottomNavLink
            tab={tab.tab}
            to={tab.to}
            icon={tab.icon}
            label={tab.label}
            active={props.current === tab.tab}
            indicatorReady={indicatorReady}
          />
        )}
      </For>
    </nav>
  )
}

function PawketBottomNavLink(props: {
  tab: PawketNavTab
  to: '/pawket' | '/pawket/checking' | '/pawket/savings'
  icon: LucideIcon
  label: string
  active: boolean
  indicatorReady: boolean
}) {
  const Icon = props.icon

  return (
    <Link
      to={props.to}
      data-nav-tab={props.tab}
      aria-current={props.active ? 'page' : undefined}
      className={cn(
        'relative grid place-items-center gap-0.5 rounded-xl px-2 py-2 transition-colors',
        !props.active && 'text-muted-foreground hover:text-primary',
        props.active && props.indicatorReady && 'text-accent-foreground',
        props.active && !props.indicatorReady && 'text-accent-foreground/80'
      )}
    >
      <Icon className="size-5" aria-hidden />

      <span className="text-[10px] leading-tight font-bold sm:text-xs">
        {props.label}
      </span>
    </Link>
  )
}

function AccountMenuPlaceholder(props: { pending: boolean }) {
  return (
    <div
      className={cn(
        'border-ink bg-muted size-10 shrink-0 rounded-full border-2 shadow-[2px_2px_0_0_var(--ink)]',
        props.pending && 'animate-pulse'
      )}
      aria-label={props.pending ? 'Loading account' : 'Account'}
    />
  )
}

function profileToAccountMenu(
  profile: { name?: string; email?: string; image?: string } | null | undefined
): ComponentProps<typeof PawketAccountMenu> | null {
  if (
    profile === undefined ||
    profile === null ||
    profile.email === undefined
  ) {
    return null
  }

  return {
    viewerEmail: profile.email,
    viewerName: profile.name,
    viewerImage: profile.image,
  }
}
