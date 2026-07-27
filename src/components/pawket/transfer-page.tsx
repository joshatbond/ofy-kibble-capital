import { useNavigate, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { ArrowLeftRight, X } from 'lucide-react'
import { useState } from 'react'

import { Case, SwitchOn } from '~/components/switch-on'
import { BarkBuckSymbol } from '~/components/brand/bark-buck-symbol'
import { MoneyAmount } from '~/components/money-amount'
import { Button } from '~/components/ui/button'
import { api } from '~/convex/_generated/api'
import { parseDollarInputToCents } from '~/lib/parse-money-input'

import type { FunctionReturnType } from 'convex/server'

export function PawketTransferPage() {
  const router = useRouter()
  const navigate = useNavigate()
  const balances = useQuery(api.features.banking.getMyBalances)
  const transferBetweenAccounts = useMutation(
    api.features.banking.transferBetweenAccounts
  )
  const [direction, setDirection] = useState<TransferDirection>(
    'savings_to_checking'
  )
  const [amountInput, setAmountInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fromAccount = transferAccount('from', direction)
  const toAccount = transferAccount('to', direction)

  const handleClose = () => {
    if (router.history.length > 1) {
      router.history.back()
      return
    }

    void navigate({ to: '/pawket/checking' })
  }

  const handleSwapDirection = () => {
    setDirection(current =>
      current === 'savings_to_checking'
        ? 'checking_to_savings'
        : 'savings_to_checking'
    )
    setAmountInput('')
    setError(null)
  }

  const handleSubmit = async () => {
    if (balances == null) return

    const availableCents = transferAvailableCents(balances, direction)
    const validation = validateTransfer({ amountInput, availableCents })
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await transferBetweenAccounts({
        direction,
        amountCents: validation.amountCents,
      })
      setAmountInput('')
      await navigate({
        to:
          direction === 'savings_to_checking'
            ? '/pawket/checking'
            : '/pawket/savings',
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Transfer failed. Try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableCents =
    balances == null ? 0 : transferAvailableCents(balances, direction)

  const canSubmit = balances != null && availableCents > 0 && !isSubmitting

  return (
    <div className="bg-background fixed inset-0 grid min-h-dvh grid-rows-[auto_1fr]">
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
                disabled={isSubmitting || balances === null}
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

        <div className="space-y-4">
          <SwitchOn>
            <Case predicate={balances === undefined}>
              <p className="text-muted-foreground text-center text-sm">
                Loading balances…
              </p>
            </Case>

            <Case predicate={balances === null}>
              <p className="text-muted-foreground text-center text-sm">
                Student account required.
              </p>
            </Case>

            <Case predicate={balances != null}>
              <TransferAccountsCard
                balances={balances}
                fromAccount={fromAccount}
                toAccount={toAccount}
                onSwap={handleSwapDirection}
              />
            </Case>
          </SwitchOn>

          <div className="min-h-5">
            <ErrorMessage message={error} />
          </div>

          <Button
            type="button"
            variant="brutal"
            className="h-auto w-full py-3 text-base"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? 'Transferring…' : 'Review transfer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function TransferAccountsCard(props: {
  balances: PawketStudentBalances | null | undefined
  fromAccount: TransferAccount
  toAccount: TransferAccount
  onSwap: () => void
}) {
  if (props.balances == null) return null

  const fromBalanceCents = props.balances[props.fromAccount.balanceKey]

  return (
    <section className="border-ink bg-card shadow-brutal grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border-2 p-4">
      <TransferAccountColumn
        role="from"
        account={props.fromAccount}
        balanceCents={fromBalanceCents}
      />

      <button
        type="button"
        className="border-ink bg-muted/40 text-primary hover:bg-muted flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        aria-label="Swap from and to accounts"
        onClick={props.onSwap}
      >
        <ArrowLeftRight className="size-5" aria-hidden />
      </button>

      <TransferAccountColumn
        role="to"
        account={props.toAccount}
        balanceCents={props.balances[props.toAccount.balanceKey]}
      />
    </section>
  )
}

function TransferAccountColumn(props: {
  role: 'from' | 'to'
  account: TransferAccount
  balanceCents: number
}) {
  return (
    <div className="grid min-w-0 place-content-center gap-1 text-center">
      <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
        {props.role}
      </p>

      <p className="text-primary truncate text-sm font-bold">
        {props.account.label}
      </p>

      <p className="text-muted-foreground truncate text-xs font-medium">
        <MoneyAmount cents={props.balanceCents} />
      </p>
    </div>
  )
}

function ErrorMessage(props: { message: string | null }) {
  if (props.message === null) return null

  return (
    <p
      className="text-destructive text-center text-sm font-medium"
      role="alert"
    >
      {props.message}
    </p>
  )
}

function transferAccount(
  side: 'from' | 'to',
  direction: TransferDirection
): TransferAccount {
  const savings: TransferAccount = {
    label: 'Savings',
    balanceKey: 'savingsUnallocatedCents',
  }
  const checking: TransferAccount = {
    label: 'Checking',
    balanceKey: 'checkingCents',
  }

  if (direction === 'savings_to_checking') {
    return side === 'from' ? savings : checking
  }

  return side === 'from' ? checking : savings
}

function validateTransfer(props: {
  amountInput: string
  availableCents: number
}): TransferValidation {
  const amountCents = parseDollarInputToCents(props.amountInput)
  if (amountCents === null) {
    return {
      ok: false,
      message: 'Enter a valid dollar amount (up to two decimal places).',
    }
  }

  if (amountCents > props.availableCents) {
    return {
      ok: false,
      message: 'That amount is more than you have available to transfer.',
    }
  }

  return { ok: true, amountCents }
}

function transferAvailableCents(
  balances: PawketStudentBalances,
  direction: TransferDirection
): number {
  return direction === 'savings_to_checking'
    ? balances.savingsUnallocatedCents
    : balances.checkingCents
}

type TransferAccount = {
  label: string
  balanceKey: 'savingsUnallocatedCents' | 'checkingCents'
}

type PawketStudentBalances = NonNullable<
  FunctionReturnType<typeof api.features.banking.getMyBalances>
>

type TransferDirection = 'savings_to_checking' | 'checking_to_savings'

type TransferValidation =
  | { ok: true; amountCents: number }
  | { ok: false; message: string }
