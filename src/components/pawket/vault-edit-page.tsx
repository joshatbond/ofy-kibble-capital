import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'

import { BarkBuckSymbol } from '~/components/brand/bark-buck-symbol'
import { PawketSubNavLink } from '~/components/pawket/vaults-list-page'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import { parseDollarInputToCents } from '~/lib/parse-money-input'

export function VaultEditPage(props: { vaultId: string }) {
  const navigate = useNavigate()
  const vaultId = props.vaultId as Id<'vaults'>
  const vault = useQuery(api.features.vaults.getMyVault, { vaultId })
  const updateVault = useMutation(api.features.vaults.updateVault)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [skipGoal, setSkipGoal] = useState(true)
  const [goalInput, setGoalInput] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (vault == null || hydrated) {
      return
    }

    setName(vault.name)
    setIcon(vault.icon)
    if (vault.goalCents != null) {
      setSkipGoal(false)
      setGoalInput((vault.goalCents / 100).toFixed(2))
    } else {
      setSkipGoal(true)
      setGoalInput('')
    }
    setHydrated(true)
  }, [hydrated, vault])

  async function handleSave() {
    setError(null)

    const trimmedName = name.trim()
    const trimmedIcon = icon.trim()
    if (trimmedName.length === 0) {
      setError('Vault name is required.')
      return
    }
    if (trimmedIcon.length === 0) {
      setError('Pick an emoji for this vault.')
      return
    }

    let goalCents: number | null = null
    if (!skipGoal) {
      const parsed = parseDollarInputToCents(goalInput)
      if (parsed === null) {
        setError('Enter a valid savings goal, or leave it uncapped.')
        return
      }
      goalCents = parsed
    }

    setSaving(true)
    try {
      await updateVault({
        vaultId,
        name: trimmedName,
        icon: trimmedIcon,
        goalCents,
      })
      await navigate({
        to: '/pawket/savings/vaults/$vaultId',
        params: { vaultId },
        replace: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save vault.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="grid gap-6 px-4 py-6 pb-8">
      <PawketSubNavLink
        to="/pawket/savings/vaults/$vaultId"
        label="Back to vault"
        vaultId={props.vaultId}
      />

      <section className="grid gap-1">
        <h1 className="font-heading text-2xl font-extrabold">Edit vault</h1>

        <p className="text-muted-foreground text-sm">
          Update the name, emoji, or savings goal. Funding mode stays the same.
        </p>
      </section>

      <SwitchOn>
        <Case predicate={vault === undefined}>
          <p className="text-muted-foreground text-sm">Loading vault…</p>
        </Case>

        <Case predicate={vault === null}>
          <p className="text-muted-foreground text-sm">Vault not found.</p>
        </Case>

        <Case predicate={vault != null}>
          <section className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="edit-vault-name">Name</Label>

              <Input
                id="edit-vault-name"
                value={name}
                maxLength={60}
                onChange={event => setName(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-vault-icon">Icon</Label>

              <Input
                id="edit-vault-icon"
                value={icon}
                maxLength={16}
                className="text-center text-2xl"
                onChange={event => setIcon(event.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <p className="text-sm font-bold">Savings goal</p>

              <button
                type="button"
                className={
                  skipGoal
                    ? 'border-ink bg-accent shadow-brutal rounded-xl border-2 p-4 text-left'
                    : 'border-ink bg-card hover:bg-muted rounded-xl border-2 p-4 text-left'
                }
                onClick={() => setSkipGoal(true)}
              >
                <p className="text-sm font-bold">No goal (uncapped)</p>
              </button>

              <button
                type="button"
                className={
                  !skipGoal
                    ? 'border-ink bg-accent shadow-brutal rounded-xl border-2 p-4 text-left'
                    : 'border-ink bg-card hover:bg-muted rounded-xl border-2 p-4 text-left'
                }
                onClick={() => setSkipGoal(false)}
              >
                <p className="text-sm font-bold">Set a savings goal</p>
              </button>

              {!skipGoal ? (
                <div className="grid gap-2">
                  <Label htmlFor="edit-vault-goal">Goal amount</Label>

                  <div className="relative">
                    <BarkBuckSymbol className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                    <Input
                      id="edit-vault-goal"
                      className="pl-9"
                      inputMode="decimal"
                      value={goalInput}
                      onChange={event => setGoalInput(event.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {error ? (
              <p className="text-destructive text-sm font-bold" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="button"
              variant="brutal"
              className="h-auto w-full py-4 text-sm font-bold"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </section>
        </Case>
      </SwitchOn>
    </main>
  )
}
