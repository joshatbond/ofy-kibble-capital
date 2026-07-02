import { Link, useParams, useRouterState } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import {
  CalendarDays,
  QrCode,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { useRef } from 'react'

import { AdminAccountMenu } from '~/components/admin/admin-account-menu'
import type { AdminAccountMenuProps } from '~/components/admin/admin-account-menu'
import { AppTheme } from '~/components/theme/app-theme'
import { For } from '~/components/ui/for'
import { api } from '~/convex/_generated/api'
import { useNavTabIndicator } from '~/hooks/use-nav-tab-indicator'
import { teacherContextQueryArgs } from '~/lib/admin-route-context'
import { cn } from '~/lib/class-name-merge'

import type { FunctionReturnType } from 'convex/server'
import type { ReactNode } from 'react'

export function AdminShell(props: { children: ReactNode }) {
  const routeParams = useParams({ strict: false })
  const orgId = 'orgId' in routeParams ? routeParams.orgId : undefined
  const classId = 'classId' in routeParams ? routeParams.classId : undefined
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    teacherContextQueryArgs({ orgId, classId })
  )
  const classrooms = useQuery(api.features.admin.context.listTeacherClassrooms)
  const contextCache = useRef<TeacherClassroomContext | null>(null)
  const classroomsCache = useRef<TeacherClassroomList | null>(null)
  const current = useAdminNavTab()

  if (context !== undefined && context !== null) {
    contextCache.current = context
  }

  if (classrooms !== undefined) {
    classroomsCache.current = classrooms
  }

  if (!orgId) {
    return <>{props.children}</>
  }

  if (context === null) {
    return <>{props.children}</>
  }

  const resolvedContext = context ?? contextCache.current
  const resolvedClassrooms = classrooms ?? classroomsCache.current

  if (!resolvedContext || !resolvedClassrooms) {
    return <>{props.children}</>
  }

  const navParams = {
    orgId,
    classId: classId ?? resolvedContext.classroomId,
  }

  return (
    <AppTheme
      theme="kibble"
      className="bg-background text-foreground @container/admin grid h-screen min-h-0 grid-rows-[1fr_auto] @min-[48rem]/admin:grid-rows-1"
    >
      <div className="grid min-h-0 grid-cols-1 @min-[48rem]/admin:grid-cols-[18rem_minmax(0,1fr)]">
        <AdminSidebar
          current={current}
          navParams={navParams}
          classroomName={resolvedContext.classroomName}
          accountMenu={{
            viewerEmail: resolvedContext.viewerEmail,
            viewerName: resolvedContext.viewerName,
            viewerImage: resolvedContext.viewerImage,
            classrooms: resolvedClassrooms,
            currentOrganizationId: resolvedContext.organizationId,
            currentClassroomId: resolvedContext.classroomId,
            currentTab: current,
          }}
        />

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] @min-[48rem]/admin:grid-rows-1">
          <AdminTopBar
            viewerEmail={resolvedContext.viewerEmail}
            viewerName={resolvedContext.viewerName}
            viewerImage={resolvedContext.viewerImage}
            classrooms={resolvedClassrooms}
            currentOrganizationId={resolvedContext.organizationId}
            currentClassroomId={resolvedContext.classroomId}
            currentTab={current}
          />

          <div className="min-h-0 overflow-y-auto overscroll-y-contain">
            {props.children}
          </div>
        </div>
      </div>

      <AdminBottomNav
        current={current}
        navParams={navParams}
        className="@min-[48rem]/admin:hidden"
      />
    </AppTheme>
  )
}
export function AdminPage(props: {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mx-auto grid max-w-300 gap-8 px-4 py-8 @min-[48rem]/admin:px-10">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl font-black tracking-tight @min-[30rem]/admin:text-5xl">
          {props.title}
        </h1>

        {props.description ? (
          <p className="text-muted-foreground text-lg">{props.description}</p>
        ) : null}

        {props.action}
      </header>

      {props.children}
    </div>
  )
}
export function AdminPosFab(props: { className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        'border-ink bg-accent text-accent-foreground shadow-brutal hover:shadow-brutal-lg fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] grid size-16 place-items-center rounded-full border-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none @min-[48rem]/admin:bottom-6',
        props.className
      )}
      aria-label="Scan student pay code"
    >
      <QrCode className="size-8" aria-hidden />
    </button>
  )
}
export type AdminNavTab = 'roster' | 'absences' | 'store' | 'settings'
function AdminTopBar(props: AdminAccountMenuProps) {
  return (
    <header className="border-ink bg-background shadow-brutal sticky top-0 border-b-2 @min-[48rem]/admin:hidden">
      <div className="mx-auto grid w-full max-w-300 grid-cols-[1fr_auto] items-center gap-4 px-4 py-4">
        <h2 className="font-heading text-primary text-xl font-bold">
          Teacher Hub
        </h2>

        <AdminAccountMenu {...props} layout="icon" />
      </div>
    </header>
  )
}
function AdminSidebar(props: {
  current: AdminNavTab
  navParams: { orgId: string; classId: string }
  classroomName: string
  accountMenu: AdminAccountMenuProps
}) {
  return (
    <aside className="border-ink bg-background hidden min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] border-r-2 @min-[48rem]/admin:grid">
      <div className="p-8 pb-4">
        <p className="font-heading text-primary text-xl font-bold">
          Kibble Admin
        </p>

        <p className="text-muted-foreground mt-1 text-sm">
          {props.classroomName}
        </p>
      </div>

      <div className="min-h-0 overflow-y-auto overscroll-y-contain">
        <AdminSidebarNav current={props.current} navParams={props.navParams} />
      </div>

      <div className="border-ink border-t-2 p-4">
        <AdminAccountMenu {...props.accountMenu} layout="sidebar" />
      </div>
    </aside>
  )
}
function AdminSidebarNav(props: {
  current: AdminNavTab
  navParams: { orgId: string; classId: string }
}) {
  const tabs = [
    {
      tab: 'roster' as const,
      to: '/admin/$orgId/$classId',
      params: props.navParams,
      icon: Users,
      label: 'Roster',
    },
    {
      tab: 'absences' as const,
      to: '/admin/$orgId/$classId/absences',
      params: props.navParams,
      icon: CalendarDays,
      label: 'Absences',
    },
    {
      tab: 'store' as const,
      to: '/admin/$orgId/$classId/store',
      params: props.navParams,
      icon: ShoppingBag,
      label: 'Student store',
    },
    {
      tab: 'settings' as const,
      to: '/admin/$orgId',
      params: { orgId: props.navParams.orgId },
      icon: Settings,
      label: 'Settings',
    },
  ]

  const { navRef, indicatorRef, indicatorReady } = useNavTabIndicator({
    current: props.current,
    orientation: 'vertical',
    layoutKey: `${props.navParams.orgId}-${props.navParams.classId}`,
  })

  return (
    <nav ref={navRef} className="relative grid content-start gap-4 px-2">
      <span
        ref={indicatorRef}
        aria-hidden
        className={cn(
          'border-ink bg-primary pointer-events-none absolute rounded-lg border-2',
          !indicatorReady && 'opacity-0'
        )}
      />

      <For data={tabs} getKey={tab => tab.tab}>
        {tab => (
          <SidebarNavLink
            tab={tab.tab}
            to={tab.to}
            params={tab.params}
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
function SidebarNavLink(props: {
  tab: AdminNavTab
  to: string
  params: Record<string, string>
  icon: typeof Users
  label: string
  active: boolean
  indicatorReady: boolean
}) {
  const Icon = props.icon

  return (
    <Link
      to={props.to}
      params={props.params}
      data-nav-tab={props.tab}
      aria-current={props.active ? 'page' : undefined}
      className={cn(
        'relative grid grid-cols-[auto_1fr] items-center gap-4 border-2 border-transparent px-4 py-3 transition-colors',
        !props.active &&
          'text-muted-foreground hover:border-ink hover:bg-muted hover:text-foreground',
        props.active && props.indicatorReady && 'text-primary-foreground',
        props.active && !props.indicatorReady && 'text-primary'
      )}
    >
      <Icon className="size-5" aria-hidden />

      <span className="text-sm font-bold">{props.label}</span>
    </Link>
  )
}
function AdminBottomNav(props: {
  current: AdminNavTab
  navParams: { orgId: string; classId: string }
  className?: string
}) {
  const tabs = [
    {
      tab: 'roster' as const,
      to: '/admin/$orgId/$classId',
      params: props.navParams,
      icon: Users,
      label: 'Students',
    },
    {
      tab: 'absences' as const,
      to: '/admin/$orgId/$classId/absences',
      params: props.navParams,
      icon: CalendarDays,
      label: 'Absences',
    },
    {
      tab: 'store' as const,
      to: '/admin/$orgId/$classId/store',
      params: props.navParams,
      icon: ShoppingBag,
      label: 'Store',
    },
    {
      tab: 'settings' as const,
      to: '/admin/$orgId',
      params: { orgId: props.navParams.orgId },
      icon: Settings,
      label: 'Settings',
    },
  ]

  const { navRef, indicatorRef, indicatorReady } = useNavTabIndicator({
    current: props.current,
    orientation: 'horizontal',
    layoutKey: `${props.navParams.orgId}-${props.navParams.classId}`,
  })

  return (
    <nav
      ref={navRef}
      className={cn(
        'border-ink bg-background relative grid grid-cols-4 gap-1 border-t-2 px-2 pt-2 shadow-[0_-4px_0_0_var(--ink)]',
        'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
        props.className
      )}
    >
      <span
        ref={indicatorRef}
        aria-hidden
        className={cn(
          'border-ink bg-primary pointer-events-none absolute rounded-lg border-2',
          !indicatorReady && 'opacity-0'
        )}
      />

      <For data={tabs} getKey={tab => tab.tab}>
        {tab => (
          <BottomNavLink
            tab={tab.tab}
            to={tab.to}
            params={tab.params}
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
function BottomNavLink(props: {
  tab: AdminNavTab
  to: string
  params: Record<string, string>
  icon: typeof Users
  label: string
  active: boolean
  indicatorReady: boolean
}) {
  const Icon = props.icon

  return (
    <Link
      to={props.to}
      params={props.params}
      data-nav-tab={props.tab}
      aria-current={props.active ? 'page' : undefined}
      className={cn(
        'relative grid place-items-center gap-0.5 px-2 py-2 transition-colors',
        !props.active && 'text-muted-foreground hover:text-primary',
        props.active && props.indicatorReady && 'text-primary-foreground',
        props.active && !props.indicatorReady && 'text-primary'
      )}
    >
      <Icon className="size-5" aria-hidden />

      <span className="text-[10px] leading-tight font-bold @min-[22rem]/admin:text-xs">
        {props.label}
      </span>
    </Link>
  )
}
function useAdminNavTab(): AdminNavTab {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  })

  if (pathname.includes('/absences')) {
    return 'absences'
  }

  if (pathname.includes('/store') || pathname.includes('/pos')) {
    return 'store'
  }

  if (/^\/admin\/[^/]+\/?$/.test(pathname)) {
    return 'settings'
  }

  return 'roster'
}
type TeacherClassroomContext = NonNullable<
  FunctionReturnType<
    typeof api.features.admin.context.getTeacherClassroomContext
  >
>
type TeacherClassroomList = FunctionReturnType<
  typeof api.features.admin.context.listTeacherClassrooms
>
