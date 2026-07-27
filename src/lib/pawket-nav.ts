const PAWKET_SAVINGS_RESERVED_SEGMENTS = new Set(['vaults'])
export function normalizePawketPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}
export function isPawketTransactionDetail(pathname: string): boolean {
  const path = normalizePawketPathname(pathname)

  if (/^\/pawket\/checking\/[^/]+$/.test(path)) {
    return true
  }

  if (/^\/pawket\/transfer\/[^/]+$/.test(path)) {
    return true
  }

  const savingsSegment = path.match(/^\/pawket\/savings\/([^/]+)$/)
  if (savingsSegment === null) {
    return false
  }

  return !PAWKET_SAVINGS_RESERVED_SEGMENTS.has(savingsSegment[1])
}
export function isPawketTransferOverlay(pathname: string): boolean {
  const path = normalizePawketPathname(pathname)

  return (
    path === '/pawket/transfer' ||
    /^\/pawket\/savings\/vaults\/[^/]+\/transfer$/.test(path)
  )
}
export function isPawketVaultRoute(pathname: string): boolean {
  const path = normalizePawketPathname(pathname)

  return (
    path === '/pawket/savings/vaults' ||
    path.startsWith('/pawket/savings/vaults/')
  )
}
export function pawketNavTab(pathname: string): PawketNavTab | null {
  if (isPawketTransactionDetail(pathname)) {
    return null
  }

  if (pathname.startsWith('/pawket/checking')) {
    return 'checking'
  }

  if (pathname.startsWith('/pawket/savings')) {
    return 'savings'
  }

  if (pathname === '/pawket' || pathname === '/pawket/') {
    return 'home'
  }

  return 'home'
}
export function pawketShellTitle(pathname: string): string {
  const path = normalizePawketPathname(pathname)

  if (isPawketTransactionDetail(pathname)) {
    return 'Transaction Detail'
  }

  if (path === '/pawket/savings/vaults') {
    return 'Vault goals'
  }

  if (path === '/pawket/transfer') {
    return 'Transfer'
  }

  if (path.startsWith('/pawket/savings/vaults/')) {
    return 'Vault goal'
  }

  return 'PawKet Change'
}
export function displayFirstName(
  profile: {
    name?: string
    email?: string
  } | null
): string {
  if (profile?.name?.trim()) {
    return profile.name.trim().split(/\s+/)[0] ?? 'Student'
  }

  if (profile?.email) {
    const local = profile.email.split('@')[0] ?? 'student'
    return local.charAt(0).toUpperCase() + local.slice(1)
  }

  return 'Student'
}
export type PawketNavTab = 'home' | 'checking' | 'savings'
