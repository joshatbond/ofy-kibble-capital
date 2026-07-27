import { useNavigate, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { ArrowLeftRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { BarkBuckSymbol } from '~/components/brand/bark-buck-symbol'
import { MoneyAmount } from '~/components/money-amount'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import { cn } from '~/lib/class-name-merge'
import { parseDollarInputToCents } from '~/lib/parse-money-input'

import type { FunctionReturnType } from 'convex/server'

export function VaultTransferPage(props: { vaultId: string }) {
  const router = useRouter()
  const navigate = useNavigate()
  const vaultId = props.vaultId as Id<'vaults'>
  const accounts = useQuery(api.features.vaults.listMyTransferAccounts)
  const transferFunds = useMutation(api.features.vaults.transferFunds)

  const [from, setFrom] = useState<TransferEndpoint>({
    type: 'vault',
    vaultId,
  })
  const [to, setTo] = useState<TransferEndpoint>({ type: 'savings' })
  const [amountInput, setAmountInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [picking, setPicking] = useState<'from' | 'to' | null>(null)
  const [swapRotationDeg, setSwapRotationDeg] = useState(0)

  useEffect(() => {
    setFrom({ type: 'vault', vaultId })
    setTo({ type: 'savings' })
  }, [vaultId])

  const fromAccount = findAccount(accounts, from)
  const toAccount = findAccount(accounts, to)
  const availableCents = fromAccount?.balanceCents ?? 0

  function handleClose() {
    if (router.history.length > 1) {
      router.history.back()
      return
    }
    void navigate({
      to: '/pawket/savings/vaults/$vaultId',
      params: { vaultId },
    })
  }

  function handleSwap() {
    setFrom(to)
    setTo(from)
    setAmountInput('')
    setError(null)
    setSwapRotationDeg(degrees => degrees + 540)
  }

  function handlePick(account: TransferAccount) {
    const endpoint = accountToEndpoint(account)
    if (picking === 'from') {
      if (endpointKey(endpoint) === endpointKey(to)) {
        setTo(from)
      }
      setFrom(endpoint)
    } else if (picking === 'to') {
      if (endpointKey(endpoint) === endpointKey(from)) {
        setFrom(to)
      }
      setTo(endpoint)
    }
    setPicking(null)
    setError(null)
  }

  async function handleTransfer() {
    const amountCents = parseDollarInputToCents(amountInput)
    if (amountCents === null) {
      setError('Enter a valid amount.')
      return
    }
    if (amountCents > availableCents) {
      setError('That amount is more than you have available.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await transferFunds({ from, to, amountCents })
      await navigate({
        to: '/pawket/savings/vaults/$vaultId',
        params: { vaultId },
        replace: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    accounts != null &&
    fromAccount != null &&
    toAccount != null &&
    availableCents > 0 &&
    !submitting

  return (
    <div className="bg-background fixed inset-0 z-50 grid min-h-dvh grid-rows-[auto_1fr]">
      <header className="flex items-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <button
          type="button"
          className="text-foreground hover:bg-muted/60 rounded-lg transition-colors"
          aria-label="Close transfer"
          onClick={handleClose}
        >
          <X className="size-6" aria-hidden />
        </button>

        <h1 className="font-heading grow text-center text-lg font-extrabold">
          Transfer money
        </h1>

        <span aria-hidden className="size-6" />
      </header>

      <div className="grid grid-rows-[1fr_auto] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="grid place-content-center gap-2 py-8">
          <label className="grid justify-items-center gap-2">
            <div className="inline-flex items-center gap-2 text-5xl font-extrabold">
              <BarkBuckSymbol className="text-muted-foreground/50 size-[0.55em] shrink-0" />

              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-label="Transfer amount"
                placeholder="0"
                value={amountInput}
                disabled={submitting || accounts == null}
                size={Math.max(amountInput.length, 1)}
                className="font-heading placeholder:text-muted-foreground/50 field-sizing-content min-w-[1ch] border-0 bg-transparent text-center text-5xl font-extrabold tracking-tight focus:ring-0 focus:outline-none"
                onChange={event => {
                  setAmountInput(event.target.value)
                  setError(null)
                }}
              />
            </div>

            <span className="text-muted-foreground text-sm font-medium">
              Amount
            </span>
          </label>
        </div>

        <div className="grid gap-4">
          <SwitchOn>
            <Case predicate={accounts === undefined}>
              <p className="text-muted-foreground text-center text-sm">
                Loading accounts…
              </p>
            </Case>

            <Case predicate={accounts != null && accounts.length === 0}>
              <p className="text-muted-foreground text-center text-sm">
                Student account required.
              </p>
            </Case>

            <Case predicate={accounts != null}>
              <section className="border-ink bg-card shadow-brutal grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border-2 p-4">
                <TransferSide
                  role="from"
                  account={fromAccount}
                  onClick={() => setPicking('from')}
                />

                <button
                  type="button"
                  className="border-ink bg-muted/40 text-primary hover:bg-muted flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                  aria-label="Swap from and to accounts"
                  onClick={handleSwap}
                >
                  <ArrowLeftRight
                    className="size-5 transition-transform duration-500 ease-out"
                    style={{ transform: `rotate(${swapRotationDeg}deg)` }}
                    aria-hidden
                  />
                </button>

                <TransferSide
                  role="to"
                  account={toAccount}
                  onClick={() => setPicking('to')}
                />
              </section>
            </Case>
          </SwitchOn>

          <div className="min-h-5">
            {error ? (
              <p
                className="text-destructive text-center text-sm font-medium"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="brutal"
            className="h-auto w-full py-3 text-base font-bold"
            disabled={!canSubmit}
            onClick={() => void handleTransfer()}
          >
            {submitting ? 'Transferring…' : 'Transfer'}
          </Button>
        </div>
      </div>

      {picking != null && accounts != null ? (
        <AccountPickerDialog
          title={picking === 'from' ? 'Transfer from' : 'Transfer to'}
          accounts={accounts}
          selectedKey={endpointKey(picking === 'from' ? from : to)}
          onSelect={handlePick}
          onClose={() => setPicking(null)}
        />
      ) : null}
    </div>
  )
}
function TransferSide(props: {
  role: 'from' | 'to'
  account: TransferAccount | undefined
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="grid min-w-0 place-content-center gap-1 text-center"
      onClick={props.onClick}
    >
      <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
        {props.role}
      </p>

      <p className="text-primary truncate text-sm font-bold">
        {props.account?.label ?? '…'}
      </p>

      <p className="text-muted-foreground truncate text-xs font-medium">
        {props.account ? (
          <MoneyAmount cents={props.account.balanceCents} />
        ) : (
          '—'
        )}
      </p>
    </button>
  )
}
function AccountPickerDialog(props: {
  title: string
  accounts: Array<TransferAccount>
  selectedKey: string
  onSelect: (account: TransferAccount) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-60 grid grid-rows-[1fr_auto]">
      <button
        type="button"
        className="bg-foreground/40"
        aria-label="Close account picker"
        onClick={props.onClose}
      />

      <div className="border-ink bg-background shadow-brutal-lg max-h-[70dvh] overflow-auto border-2 border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-extrabold">{props.title}</h2>

          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
            onClick={props.onClose}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="border-ink bg-card divide-ink divide-y-2 overflow-hidden rounded-xl border-2">
          <For
            data={props.accounts}
            getKey={account => endpointKey(accountToEndpoint(account))}
          >
            {account => {
              const key = endpointKey(accountToEndpoint(account))
              const selected = key === props.selectedKey
              return (
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
                    selected ? 'bg-accent' : 'hover:bg-muted'
                  )}
                  onClick={() => props.onSelect(account)}
                >
                  <span className="flex min-w-0 items-center gap-2 font-bold">
                    {account.icon ? (
                      <span aria-hidden>{account.icon}</span>
                    ) : null}

                    <span className="truncate">{account.label}</span>
                  </span>

                  <span className="shrink-0 text-sm font-bold tabular-nums">
                    <MoneyAmount cents={account.balanceCents} />
                  </span>
                </button>
              )
            }}
          </For>
        </div>
      </div>
    </div>
  )
}
function findAccount(
  accounts: Array<TransferAccount> | undefined,
  endpoint: TransferEndpoint
): TransferAccount | undefined {
  if (accounts === undefined) return undefined
  return accounts.find(
    account => endpointKey(accountToEndpoint(account)) === endpointKey(endpoint)
  )
}
function accountToEndpoint(account: TransferAccount): TransferEndpoint {
  if (account.type === 'vault') {
    if (account.vaultId === undefined) {
      throw new Error('Vault account missing id.')
    }
    return { type: 'vault', vaultId: account.vaultId }
  }
  return { type: account.type }
}
function endpointKey(endpoint: TransferEndpoint): string {
  if (endpoint.type === 'vault') {
    return `vault:${endpoint.vaultId}`
  }
  return endpoint.type
}
type TransferAccount = FunctionReturnType<
  typeof api.features.vaults.listMyTransferAccounts
>[number]
type TransferEndpoint =
  | { type: 'checking' }
  | { type: 'savings' }
  | { type: 'vault'; vaultId: Id<'vaults'> }
