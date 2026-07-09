import type { api } from '~/convex/_generated/api'

import type { FunctionReturnType } from 'convex/server'

const STORAGE_KEY = 'pawket-offline-banking-v1'
export function readPawketOfflineSnapshot(): PawketOfflineSnapshot | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isPawketOfflineSnapshot(parsed)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}
export function writePawketOfflineSnapshot(
  snapshot: PawketOfflineSnapshot
): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function readCachedActivityRows(
  accountKind?: PawketOfflineActivityRow['accountKind']
): Array<PawketOfflineActivityRow> {
  const rows = readPawketOfflineSnapshot()?.activity ?? []
  if (accountKind === undefined) {
    return rows
  }

  return rows.filter(row => row.accountKind === accountKind)
}

export function formatOfflineSyncedAt(syncedAt: number): string {
  return new Date(syncedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
export type PawketOfflineBalances = NonNullable<
  FunctionReturnType<typeof api.features.banking.getMyBalances>
>
export type PawketOfflineActivityRow = NonNullable<
  FunctionReturnType<typeof api.features.banking.getMyLedgerEntry>
>
export type PawketOfflineSnapshot = {
  syncedAt: number
  balances: PawketOfflineBalances | null
  activity: Array<PawketOfflineActivityRow>
}
function isPawketOfflineSnapshot(
  value: unknown
): value is PawketOfflineSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.syncedAt === 'number' &&
    Array.isArray(record.activity) &&
    (record.balances === null || typeof record.balances === 'object')
  )
}
