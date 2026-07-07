import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { ArrowLeft, ArrowLeftRight } from 'lucide-react'
import { useState } from 'react'

import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { api } from '~/convex/_generated/api'
import { formatCents, formatCentsWithLabel } from '~/lib/format-money'
import { parseDollarInputToCents } from '~/lib/parse-money-input'

import type { FunctionReturnType } from 'convex/server'

export function PawketTransferPage() {
  const navigate = useNavigate()
  const balances = useQuery(api.features.banking.getMyBalances)
  const sweepToChecking = useMutation(api.features.banking.sweepToChecking)
  const [amountInput, setAmountInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (balances == null) return

    const direction: TransferDirection = 'savings_to_checking'
    const availableCents = transferAvailableCents(balances, direction)

    const validation = validateTransfer({ amountInput, availableCents })
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await sweepToChecking({ amountCents: validation.amountCents })
      setAmountInput('')
      await navigate({ to: '/pawket/checking' })
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

  const handleSweepAll = () => {
    if (
      balances === undefined ||
      balances === null ||
      balances.savingsCents <= 0
    ) {
      return
    }

    setAmountInput((balances.savingsCents / 100).toFixed(2))
    setError(null)
  }

  return (
    <main className="grid gap-6 px-4 py-6 pb-8">
      <Link
        to="/pawket/savings"
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-bold transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to savings
      </Link>

      <section className="grid gap-1">
        <h1 className="font-heading text-2xl font-extrabold">
          Transfer to checking
        </h1>

        <p className="text-muted-foreground text-sm">
          Move money from savings into checking so you can spend at the student
          store. Money set aside for vault goals stays in savings.
        </p>
      </section>

      <SwitchOn>
        <Case predicate={balances === undefined}>
          <p className="text-muted-foreground text-sm">Loading balances…</p>
        </Case>

        <Case predicate={balances === null}>
          <p className="text-muted-foreground text-sm">
            Student account required.
          </p>
        </Case>

        <Case predicate={balances != null}>
          <SweepBalancesSection balances={balances} />
        </Case>
      </SwitchOn>

      <section className="border-ink bg-muted/30 grid gap-4 rounded-xl border-2 border-dashed p-6">
        <div className="grid gap-2">
          <Label htmlFor="transfer-amount">Amount to transfer</Label>

          <Input
            id="transfer-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amountInput}
            disabled={isSubmitting || balances === null}
            onChange={event => {
              setAmountInput(event.target.value)
              setError(null)
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="brutal-outline"
            disabled={
              balances === null ||
              balances === undefined ||
              balances.savingsCents <= 0
            }
            onClick={handleSweepAll}
          >
            Use full savings balance
          </Button>
        </div>

        <ErrorMessage message={error} />

        <Button
          type="button"
          variant="brutal"
          className="gap-2"
          disabled={
            isSubmitting ||
            balances === null ||
            balances === undefined ||
            balances.savingsCents <= 0
          }
          onClick={() => void handleSubmit()}
        >
          <ArrowLeftRight className="size-4" aria-hidden />

          {isSubmitting ? 'Transferring…' : 'Transfer to checking'}
        </Button>
      </section>
    </main>
  )
}
function SweepBalancesSection(props: {
  balances: PawketStudentBalances | null | undefined
}) {
  if (props.balances == null) return null

  return (
    <section className="border-ink bg-card shadow-brutal grid gap-4 rounded-xl border-2 p-6">
      <div className="grid gap-1">
        <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Available in savings
        </p>

        <p className="font-heading text-3xl font-extrabold">
          {formatCentsWithLabel(
            props.balances.savingsCents,
            props.balances.currencyLabel
          )}
        </p>
      </div>

      <div className="border-ink bg-muted/40 grid gap-2 rounded-lg border-2 p-4 text-sm">
        <p>
          Checking now:&nbsp;
          <span className="font-bold">
            {formatCents(props.balances.checkingCents)}
          </span>
        </p>
      </div>
    </section>
  )
}
function ErrorMessage(props: { message: string | null }) {
  if (props.message === null) return null

  return (
    <p className="text-destructive text-sm font-medium" role="alert">
      {props.message}
    </p>
  )
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
    ? balances.savingsCents
    : balances.checkingCents
}
type PawketStudentBalances = NonNullable<
  FunctionReturnType<typeof api.features.banking.getMyBalances>
>
type TransferDirection = 'savings_to_checking' | 'checking_to_savings'

type TransferValidation =
  | { ok: true; amountCents: number }
  | { ok: false; message: string }
