import { useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useState } from 'react'

import { BarkBuckSymbol } from '~/components/brand/bark-buck-symbol'
import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { api } from '~/convex/_generated/api'
import { cn } from '~/lib/class-name-merge'
import { parseDollarInputToCents } from '~/lib/parse-money-input'

export function VaultSetupWizard() {
  const navigate = useNavigate()
  const createVault = useMutation(api.features.vaults.createVault)
  const [step, setStep] = useState<WizardStep>('identity')
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const [skipGoal, setSkipGoal] = useState(true)
  const [fundingMode, setFundingMode] = useState<FundingMode>('manual')
  const [onDepositKind, setOnDepositKind] = useState<OnDepositKind>('percent')
  const [percentInput, setPercentInput] = useState('10')
  const [fixedAmountInput, setFixedAmountInput] = useState('')
  const [scheduledAmountInput, setScheduledAmountInput] = useState('')
  const [scheduleCadence, setScheduleCadence] =
    useState<ScheduleCadence>('weekly')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    setError(null)

    const trimmedName = name.trim()
    if (trimmedName.length === 0) {
      setError('Vault name is required.')
      setStep('identity')
      return
    }

    const trimmedIcon = icon.trim()
    if (trimmedIcon.length === 0) {
      setError('Pick an emoji for this vault.')
      setStep('identity')
      return
    }

    let goalCents: number | undefined
    if (!skipGoal) {
      const parsedGoal = parseDollarInputToCents(goalInput)
      if (parsedGoal === null) {
        setError('Enter a valid savings goal amount, or skip the goal.')
        setStep('goal')
        return
      }
      goalCents = parsedGoal
    }

    const funding = buildFundingArgs({
      fundingMode,
      onDepositKind,
      percentInput,
      fixedAmountInput,
      scheduledAmountInput,
      scheduleCadence,
    })
    if (!funding.ok) {
      setError(funding.message)
      setStep(
        fundingMode === 'manual' ? 'funding' : 'fundingDetails'
      )
      return
    }

    setSaving(true)
    try {
      const created = await createVault({
        name: trimmedName,
        icon: trimmedIcon,
        goalCents,
        ...funding.args,
      })
      await navigate({
        to: '/pawket/savings/vaults/$vaultId',
        params: { vaultId: created._id },
        replace: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create vault.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="grid gap-6 px-4 py-6 pb-8">
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-left text-sm font-bold"
        onClick={() =>
          void navigate({ to: '/pawket/savings/vaults', replace: true })
        }
      >
        ← Cancel
      </button>

      <section className="grid gap-1">
        <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Vault setup · Step {stepNumber(step)} of{' '}
          {totalSteps(step, fundingMode)}
        </p>

        <h1 className="font-heading text-2xl font-extrabold">
          {stepTitle(step, fundingMode)}
        </h1>

        <p className="text-muted-foreground text-sm">
          {stepDescription(step, fundingMode)}
        </p>
      </section>

      {step === 'identity' ? (
        <IdentityStep
          name={name}
          icon={icon}
          onNameChange={setName}
          onIconChange={setIcon}
          onNext={() => {
            if (name.trim().length === 0) {
              setError('Vault name is required.')
              return
            }
            if (icon.trim().length === 0) {
              setError('Pick an emoji for this vault.')
              return
            }
            setError(null)
            setStep('goal')
          }}
        />
      ) : null}

      {step === 'goal' ? (
        <GoalStep
          skipGoal={skipGoal}
          goalInput={goalInput}
          onSkipChange={setSkipGoal}
          onGoalInputChange={setGoalInput}
          onBack={() => {
            setError(null)
            setStep('identity')
          }}
          onNext={() => {
            if (!skipGoal && parseDollarInputToCents(goalInput) === null) {
              setError('Enter a valid savings goal amount, or skip the goal.')
              return
            }
            setError(null)
            setStep('funding')
          }}
        />
      ) : null}

      {step === 'funding' ? (
        <FundingStep
          fundingMode={fundingMode}
          saving={saving}
          onFundingModeChange={setFundingMode}
          onBack={() => {
            setError(null)
            setStep('goal')
          }}
          onContinue={() => {
            setError(null)
            if (fundingMode === 'manual') {
              void handleCreate()
              return
            }
            setStep('fundingDetails')
          }}
        />
      ) : null}

      {step === 'fundingDetails' && fundingMode !== 'manual' ? (
        <FundingDetailsStep
          fundingMode={fundingMode}
          onDepositKind={onDepositKind}
          percentInput={percentInput}
          fixedAmountInput={fixedAmountInput}
          scheduledAmountInput={scheduledAmountInput}
          scheduleCadence={scheduleCadence}
          saving={saving}
          onDepositKindChange={setOnDepositKind}
          onPercentInputChange={setPercentInput}
          onFixedAmountInputChange={setFixedAmountInput}
          onScheduledAmountInputChange={setScheduledAmountInput}
          onScheduleCadenceChange={setScheduleCadence}
          onBack={() => {
            setError(null)
            setStep('funding')
          }}
          onCreate={() => void handleCreate()}
        />
      ) : null}

      {error ? (
        <p className="text-destructive text-sm font-bold" role="alert">
          {error}
        </p>
      ) : null}
    </main>
  )
}
function IdentityStep(props: {
  name: string
  icon: string
  onNameChange: (value: string) => void
  onIconChange: (value: string) => void
  onNext: () => void
}) {
  return (
    <section className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="vault-name">Name</Label>

        <Input
          id="vault-name"
          value={props.name}
          maxLength={60}
          placeholder="What are you saving for?"
          onChange={event => props.onNameChange(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="vault-icon">Icon</Label>

        <Input
          id="vault-icon"
          value={props.icon}
          maxLength={16}
          placeholder="😀"
          className="text-center text-2xl"
          onChange={event => props.onIconChange(event.target.value)}
        />

        <p className="text-muted-foreground text-xs">
          Use your keyboard emoji picker.
        </p>
      </div>

      <Button
        type="button"
        variant="brutal"
        className="h-auto w-full py-4 text-sm font-bold"
        onClick={props.onNext}
      >
        Continue
      </Button>
    </section>
  )
}
function GoalStep(props: {
  skipGoal: boolean
  goalInput: string
  onSkipChange: (value: boolean) => void
  onGoalInputChange: (value: string) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <section className="grid gap-5">
      <div className="grid gap-3">
        <button
          type="button"
          className={cn(
            'border-ink rounded-xl border-2 p-4 text-left transition-all',
            props.skipGoal
              ? 'bg-accent shadow-brutal'
              : 'bg-card hover:bg-muted'
          )}
          onClick={() => props.onSkipChange(true)}
        >
          <p className="text-sm font-bold">No goal (uncapped)</p>

          <p className="text-muted-foreground text-xs">
            Keep saving without a target amount.
          </p>
        </button>

        <button
          type="button"
          className={cn(
            'border-ink rounded-xl border-2 p-4 text-left transition-all',
            !props.skipGoal
              ? 'bg-accent shadow-brutal'
              : 'bg-card hover:bg-muted'
          )}
          onClick={() => props.onSkipChange(false)}
        >
          <p className="text-sm font-bold">Set a savings goal</p>

          <p className="text-muted-foreground text-xs">
            Auto-funding stops when the goal is reached.
          </p>
        </button>
      </div>

      {!props.skipGoal ? (
        <div className="grid gap-2">
          <Label htmlFor="vault-goal">Goal amount</Label>

          <div className="relative">
            <BarkBuckSymbol className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

            <Input
              id="vault-goal"
              className="pl-9"
              inputMode="decimal"
              placeholder="100.00"
              value={props.goalInput}
              onChange={event => props.onGoalInputChange(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="brutal-outline"
          className="h-auto py-4 text-sm font-bold"
          onClick={props.onBack}
        >
          Back
        </Button>

        <Button
          type="button"
          variant="brutal"
          className="h-auto py-4 text-sm font-bold"
          onClick={props.onNext}
        >
          Continue
        </Button>
      </div>
    </section>
  )
}
function FundingStep(props: {
  fundingMode: FundingMode
  saving: boolean
  onFundingModeChange: (value: FundingMode) => void
  onBack: () => void
  onContinue: () => void
}) {
  const primaryLabel =
    props.fundingMode === 'manual'
      ? props.saving
        ? 'Creating…'
        : 'Create vault'
      : 'Continue'

  return (
    <section className="grid gap-5">
      <div className="grid gap-2">
        <FundingModeButton
          selected={props.fundingMode === 'on_deposit'}
          title="On deposit"
          description="First cut from each paycheck."
          onClick={() => props.onFundingModeChange('on_deposit')}
        />

        <FundingModeButton
          selected={props.fundingMode === 'scheduled'}
          title="Scheduled"
          description="Recurring transfer from savings."
          onClick={() => props.onFundingModeChange('scheduled')}
        />

        <FundingModeButton
          selected={props.fundingMode === 'manual'}
          title="Manual"
          description="Move money yourself when you want."
          onClick={() => props.onFundingModeChange('manual')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="brutal-outline"
          className="h-auto py-4 text-sm font-bold"
          disabled={props.saving}
          onClick={props.onBack}
        >
          Back
        </Button>

        <Button
          type="button"
          variant="brutal"
          className="h-auto py-4 text-sm font-bold"
          disabled={props.saving}
          onClick={props.onContinue}
        >
          {primaryLabel}
        </Button>
      </div>
    </section>
  )
}
function FundingDetailsStep(props: {
  fundingMode: Exclude<FundingMode, 'manual'>
  onDepositKind: OnDepositKind
  percentInput: string
  fixedAmountInput: string
  scheduledAmountInput: string
  scheduleCadence: ScheduleCadence
  saving: boolean
  onDepositKindChange: (value: OnDepositKind) => void
  onPercentInputChange: (value: string) => void
  onFixedAmountInputChange: (value: string) => void
  onScheduledAmountInputChange: (value: string) => void
  onScheduleCadenceChange: (value: ScheduleCadence) => void
  onBack: () => void
  onCreate: () => void
}) {
  return (
    <section className="grid gap-5">
      {props.fundingMode === 'on_deposit' ? (
        <OnDepositFields
          kind={props.onDepositKind}
          percentInput={props.percentInput}
          fixedAmountInput={props.fixedAmountInput}
          onKindChange={props.onDepositKindChange}
          onPercentInputChange={props.onPercentInputChange}
          onFixedAmountInputChange={props.onFixedAmountInputChange}
        />
      ) : (
        <ScheduledFields
          amountInput={props.scheduledAmountInput}
          cadence={props.scheduleCadence}
          onAmountInputChange={props.onScheduledAmountInputChange}
          onCadenceChange={props.onScheduleCadenceChange}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="brutal-outline"
          className="h-auto py-4 text-sm font-bold"
          disabled={props.saving}
          onClick={props.onBack}
        >
          Back
        </Button>

        <Button
          type="button"
          variant="brutal"
          className="h-auto py-4 text-sm font-bold"
          disabled={props.saving}
          onClick={props.onCreate}
        >
          {props.saving ? 'Creating…' : 'Create vault'}
        </Button>
      </div>
    </section>
  )
}
function FundingModeButton(props: {
  selected: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'border-ink rounded-xl border-2 p-4 text-left transition-all',
        props.selected ? 'bg-accent shadow-brutal' : 'bg-card hover:bg-muted'
      )}
      onClick={props.onClick}
    >
      <p className="text-sm font-bold">{props.title}</p>

      <p className="text-muted-foreground text-xs">{props.description}</p>
    </button>
  )
}
function OnDepositFields(props: {
  kind: OnDepositKind
  percentInput: string
  fixedAmountInput: string
  onKindChange: (value: OnDepositKind) => void
  onPercentInputChange: (value: string) => void
  onFixedAmountInputChange: (value: string) => void
}) {
  return (
    <div className="border-ink bg-card grid gap-4 rounded-xl border-2 p-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={props.kind === 'percent' ? 'brutal' : 'brutal-outline'}
          className="h-auto py-3 text-sm font-bold"
          onClick={() => props.onKindChange('percent')}
        >
          Percent
        </Button>

        <Button
          type="button"
          variant={props.kind === 'fixed' ? 'brutal' : 'brutal-outline'}
          className="h-auto py-3 text-sm font-bold"
          onClick={() => props.onKindChange('fixed')}
        >
          Fixed amount
        </Button>
      </div>

      {props.kind === 'percent' ? (
        <div className="grid gap-2">
          <Label htmlFor="on-deposit-percent">Percent of net pay</Label>

          <Input
            id="on-deposit-percent"
            inputMode="numeric"
            value={props.percentInput}
            onChange={event => props.onPercentInputChange(event.target.value)}
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="on-deposit-fixed">Fixed amount each payday</Label>

          <div className="relative">
            <BarkBuckSymbol className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

            <Input
              id="on-deposit-fixed"
              className="pl-9"
              inputMode="decimal"
              placeholder="5.00"
              value={props.fixedAmountInput}
              onChange={event =>
                props.onFixedAmountInputChange(event.target.value)
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
function ScheduledFields(props: {
  amountInput: string
  cadence: ScheduleCadence
  onAmountInputChange: (value: string) => void
  onCadenceChange: (value: ScheduleCadence) => void
}) {
  return (
    <div className="border-ink bg-card grid gap-4 rounded-xl border-2 p-4">
      <div className="grid gap-2">
        <Label htmlFor="scheduled-amount">Amount each run</Label>

        <div className="relative">
          <BarkBuckSymbol className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

          <Input
            id="scheduled-amount"
            className="pl-9"
            inputMode="decimal"
            placeholder="5.00"
            value={props.amountInput}
            onChange={event => props.onAmountInputChange(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Cadence</Label>

        <div className="grid grid-cols-3 gap-2">
          <For
            data={
              [
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' },
              ] as const
            }
            getKey={option => option.value}
          >
            {option => (
              <Button
                type="button"
                variant={
                  props.cadence === option.value ? 'brutal' : 'brutal-outline'
                }
                className="h-auto px-2 py-3 text-xs font-bold"
                onClick={() => props.onCadenceChange(option.value)}
              >
                {option.label}
              </Button>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
function stepNumber(step: WizardStep): number {
  switch (step) {
    case 'identity':
      return 1
    case 'goal':
      return 2
    case 'funding':
      return 3
    case 'fundingDetails':
      return 4
  }
}
function totalSteps(step: WizardStep, fundingMode: FundingMode): number {
  if (step === 'fundingDetails') {
    return 4
  }
  if (step === 'funding' && fundingMode !== 'manual') {
    return 4
  }
  return 3
}
function stepTitle(step: WizardStep, fundingMode: FundingMode): string {
  switch (step) {
    case 'identity':
      return 'Name your vault'
    case 'goal':
      return 'Savings goal'
    case 'funding':
      return 'How to fund it'
    case 'fundingDetails':
      return fundingMode === 'scheduled'
        ? 'Scheduled funding'
        : 'On-deposit funding'
  }
}
function stepDescription(step: WizardStep, fundingMode: FundingMode): string {
  switch (step) {
    case 'identity':
      return 'Pick a name and emoji. You start with zero vaults.'
    case 'goal':
      return 'Optional. Leave uncapped if you do not want a target yet.'
    case 'funding':
      return 'Choose on-deposit, scheduled, or manual funding.'
    case 'fundingDetails':
      return fundingMode === 'scheduled'
        ? 'Set how much to move from savings and how often.'
        : 'Set the first-cut amount taken from each paycheck.'
  }
}
function buildFundingArgs(props: {
  fundingMode: FundingMode
  onDepositKind: OnDepositKind
  percentInput: string
  fixedAmountInput: string
  scheduledAmountInput: string
  scheduleCadence: ScheduleCadence
}):
  | {
      ok: true
      args: {
        fundingMode: FundingMode
        onDepositRule?:
          | { kind: 'percent'; percent: number }
          | { kind: 'fixed'; amountCents: number }
        scheduledAmountCents?: number
        scheduleCadence?: ScheduleCadence
      }
    }
  | { ok: false; message: string } {
  if (props.fundingMode === 'manual') {
    return { ok: true, args: { fundingMode: 'manual' } }
  }

  if (props.fundingMode === 'on_deposit') {
    if (props.onDepositKind === 'percent') {
      const percent = Number(props.percentInput)
      if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
        return {
          ok: false,
          message: 'On-deposit percent must be a whole number from 1 to 100.',
        }
      }
      return {
        ok: true,
        args: {
          fundingMode: 'on_deposit',
          onDepositRule: { kind: 'percent', percent },
        },
      }
    }

    const amountCents = parseDollarInputToCents(props.fixedAmountInput)
    if (amountCents === null) {
      return {
        ok: false,
        message: 'Enter a valid fixed on-deposit amount.',
      }
    }
    return {
      ok: true,
      args: {
        fundingMode: 'on_deposit',
        onDepositRule: { kind: 'fixed', amountCents },
      },
    }
  }

  const scheduledAmountCents = parseDollarInputToCents(
    props.scheduledAmountInput
  )
  if (scheduledAmountCents === null) {
    return {
      ok: false,
      message: 'Enter a valid scheduled transfer amount.',
    }
  }

  return {
    ok: true,
    args: {
      fundingMode: 'scheduled',
      scheduledAmountCents,
      scheduleCadence: props.scheduleCadence,
    },
  }
}
type FundingMode = 'manual' | 'on_deposit' | 'scheduled'
type OnDepositKind = 'percent' | 'fixed'
type ScheduleCadence = 'weekly' | 'biweekly' | 'monthly'
type WizardStep = 'identity' | 'goal' | 'funding' | 'fundingDetails'
