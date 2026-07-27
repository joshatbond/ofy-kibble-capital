import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'

import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import { Label } from '~/components/ui/label'
import { api } from '~/convex/_generated/api'
import { cn } from '~/lib/class-name-merge'

const PRESETS = [
  { label: 'All checking', savingsPercent: 0 },
  { label: '20% savings', savingsPercent: 20 },
  { label: '50 / 50', savingsPercent: 50 },
  { label: 'All savings', savingsPercent: 100 },
] as const

export function PaySplitWizard() {
  const paySplit = useQuery(api.features.paySplit.getMyPaySplit)
  const setPaySplit = useMutation(api.features.paySplit.setMyPaySplit)
  const navigate = useNavigate()
  const [savingsPercent, savingsPercentAssign] = useState(20)
  const [hydrated, hydratedAssign] = useState(false)
  const [error, errorAssign] = useState<string | null>(null)
  const [saving, savingAssign] = useState(false)

  useEffect(() => {
    if (paySplit == null || hydrated) {
      return
    }

    if (paySplit.isConfigured) {
      savingsPercentAssign(paySplit.savingsPercent)
    }

    hydratedAssign(true)
  }, [hydrated, paySplit])

  const checkingPercent = 100 - savingsPercent
  const alreadyConfigured = paySplit?.isConfigured === true

  async function handleSave() {
    errorAssign(null)
    savingAssign(true)

    try {
      await setPaySplit({ savingsPercent })
      await navigate({ to: '/kibble', replace: true })
    } catch (err) {
      errorAssign(
        err instanceof Error ? err.message : 'Could not save pay split.'
      )
    } finally {
      savingAssign(false)
    }
  }

  if (paySplit === undefined) {
    return (
      <main className="mx-auto grid max-w-lg gap-4 px-4 py-10">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </main>
    )
  }

  if (paySplit === null) {
    return (
      <main className="mx-auto grid max-w-lg gap-4 px-4 py-10">
        <h1 className="font-heading text-2xl font-extrabold">Pay split</h1>
        <p className="text-muted-foreground text-sm">
          Student account required to set a pay split.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto grid max-w-lg gap-6 px-4 py-10">
      <section className="grid gap-2">
        <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Required setup
        </p>
        <h1 className="font-heading text-3xl font-extrabold">Pay split</h1>
        <p className="text-muted-foreground text-sm">
          Choose how each paycheck splits between Checking and Savings after
          vault deposits. You can change this later.
        </p>
        {alreadyConfigured ? (
          <p className="text-sm font-bold">
            Current: {paySplit.savingsPercent}% savings /{' '}
            {paySplit.checkingPercent}% checking
          </p>
        ) : null}
      </section>

      <section className="grid gap-3">
        <p className="text-sm font-bold">Quick picks</p>
        <div className="grid grid-cols-2 gap-2">
          <For data={[...PRESETS]} getKey={preset => preset.label}>
            {preset => (
              <Button
                type="button"
                variant={
                  savingsPercent === preset.savingsPercent
                    ? 'brutal'
                    : 'brutal-outline'
                }
                className="h-auto py-3 text-sm font-bold"
                onClick={() => savingsPercentAssign(preset.savingsPercent)}
              >
                {preset.label}
              </Button>
            )}
          </For>
        </div>
      </section>

      <section className="border-ink bg-card shadow-brutal grid gap-4 rounded-xl border-2 p-5">
        <div className="grid gap-2">
          <Label htmlFor="savings-percent">Savings: {savingsPercent}%</Label>
          <input
            id="savings-percent"
            type="range"
            min={0}
            max={100}
            step={5}
            value={savingsPercent}
            onChange={event =>
              savingsPercentAssign(Number(event.target.value))
            }
            className="w-full accent-[var(--primary)]"
          />
          <p className="text-muted-foreground text-sm">
            Checking gets {checkingPercent}%
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <SplitPreview
            label="Checking"
            percent={checkingPercent}
            tone="primary"
          />
          <SplitPreview
            label="Savings"
            percent={savingsPercent}
            tone="accent"
          />
        </div>
      </section>

      {error ? (
        <p className="text-destructive text-sm font-bold" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="brutal"
        size="lg"
        className="h-auto w-full py-4 text-base font-bold"
        disabled={saving}
        onClick={() => void handleSave()}
      >
        {saving
          ? 'Saving…'
          : alreadyConfigured
            ? 'Update pay split'
            : 'Save pay split'}
      </Button>
    </main>
  )
}

function SplitPreview(props: {
  label: string
  percent: number
  tone: 'primary' | 'accent'
}) {
  return (
    <div
      className={cn(
        'border-ink rounded-lg border-2 p-3',
        props.tone === 'primary' ? 'bg-primary/15' : 'bg-accent/40'
      )}
    >
      <p className="text-xs font-bold uppercase opacity-70">{props.label}</p>
      <p className="font-heading text-2xl font-extrabold">{props.percent}%</p>
    </div>
  )
}
