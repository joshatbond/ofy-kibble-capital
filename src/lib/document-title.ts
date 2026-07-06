import { isPawketTransactionDetail } from '~/lib/pawket-nav'
import { appThemes } from '~/lib/themes'

const ADMIN_APP_NAME = 'Kibble Admin'

export function formatDocumentTitle(pathname: string): string {
  const path = normalizePathname(pathname)

  if (path.startsWith('/admin')) {
    return formatAdminDocumentTitle(path)
  }

  return `${appNameForPathname(pathname)} | ${pageTitleForPathname(pathname)}`
}

function formatAdminDocumentTitle(path: string): string {
  const section = adminSectionTitle(path)

  if (section === null) {
    return ADMIN_APP_NAME
  }

  return `${ADMIN_APP_NAME} | ${section}`
}

function adminSectionTitle(path: string): string | null {
  if (!path.startsWith('/admin')) {
    return null
  }

  if (path === '/admin') {
    return null
  }

  if (path === '/admin/landing') {
    return 'Sign in'
  }

  if (path.includes('/settings')) {
    return 'Global settings'
  }

  if (path.includes('/absences')) {
    return 'Absences'
  }

  if (path.includes('/store') || path.includes('/pos')) {
    return 'Student store'
  }

  if (/^\/admin\/[^/]+$/.test(path)) {
    return 'Student roster'
  }

  return null
}

function appNameForPathname(pathname: string): string {
  if (pathname.startsWith('/pawket')) {
    return appThemes.pawket
  }

  return appThemes.kibble
}

function pageTitleForPathname(pathname: string): string {
  const path = normalizePathname(pathname)

  if (path.startsWith('/pawket')) {
    return pawketPageTitle(pathname, path)
  }

  if (path.startsWith('/kibble')) {
    return kibblePageTitle(path)
  }

  if (path.startsWith('/invite/')) {
    return 'Accept invitation'
  }

  return 'Home'
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function kibblePageTitle(path: string): string {
  if (path === '/kibble' || path === '/kibble/landing') {
    return path.endsWith('/landing') ? 'Landing' : 'Dashboard'
  }

  if (path === '/kibble/time') {
    return 'Time'
  }

  if (path === '/kibble/pay') {
    return 'Pay'
  }

  if (path.startsWith('/kibble/pay/')) {
    return 'Pay stub'
  }

  if (path === '/kibble/absence') {
    return 'Absence'
  }

  if (path.startsWith('/kibble/absence/')) {
    return 'Absence request'
  }

  return 'Dashboard'
}

function pawketPageTitle(pathname: string, path: string): string {
  if (path === '/pawket' || path === '/pawket/landing') {
    return path.endsWith('/landing') ? 'Landing' : 'Dashboard'
  }

  if (isPawketTransactionDetail(pathname)) {
    return 'Transaction detail'
  }

  if (path === '/pawket/savings/vaults') {
    return 'Vault goals'
  }

  if (path.startsWith('/pawket/savings/vaults/')) {
    if (path.includes('/transactions')) {
      return 'Vault transactions'
    }

    return 'Vault goal'
  }

  if (path.startsWith('/pawket/transfer')) {
    return 'Transfer'
  }

  if (path.startsWith('/pawket/checking')) {
    return 'Checking'
  }

  if (path.startsWith('/pawket/savings')) {
    return 'Savings'
  }

  return 'Dashboard'
}
