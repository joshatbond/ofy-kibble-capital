import { WifiOff } from 'lucide-react'

import {
  formatOfflineSyncedAt,
  readPawketOfflineSnapshot,
} from '~/lib/pawket-offline-cache'

export function PawketOfflineBanner(props: { isOnline: boolean }) {
  if (props.isOnline) {
    return null
  }

  const snapshot = readPawketOfflineSnapshot()
  const syncedLabel =
    snapshot === null
      ? 'No saved data yet'
      : `Last synced ${formatOfflineSyncedAt(snapshot.syncedAt)}`

  return (
    <div
      role="status"
      className="border-ink bg-accent text-accent-foreground flex items-start gap-3 border-b-2 px-4 py-3 text-sm"
    >
      <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />

      <div className="grid gap-0.5">
        <p className="font-bold">You&apos;re offline</p>

        <p className="text-accent-foreground/90">
          Balances and activity are read-only. {syncedLabel}. Transfers and
          other money moves resume when you reconnect.
        </p>
      </div>
    </div>
  )
}
