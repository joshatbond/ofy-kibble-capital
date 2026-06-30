import { useMutation } from 'convex/react'
import { Percent, Wallet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AdminPage } from '~/components/admin/admin-shell'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { api } from '~/convex/_generated/api'
import { cn } from '~/lib/class-name-merge'
import { formatPaySchedule } from '~/lib/format-money'

import type { FunctionReturnType } from 'convex/server'
import type { ReactNode } from 'react'

export function AdminSettingsPage(props: {
  organizationId: string
  classroomName: string
  settings: ClassroomSettings
}) {
  const updateSettings = useMutation(
    api.features.settings.updateClassSettingsForOrganization
  )
  const [draft, setDraft] = useState(props.settings)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [formPending, setFormPending] = useState(false)
  const hasLocalEditsRef = useRef(false)

  useEffect(() => {
    if (!hasLocalEditsRef.current) {
      setDraft(props.settings)
    }
  }, [props.settings])

  const isDirty =
    hasLocalEditsRef.current && settingsDiffer(draft, props.settings)

  function markEditing() {
    hasLocalEditsRef.current = true
    setFormSuccess(null)
  }

  function markDraft(
    updater: (current: ClassroomSettings) => ClassroomSettings
  ) {
    hasLocalEditsRef.current = true
    setFormSuccess(null)
    setDraft(updater)
  }

  return (
    <AdminPage
      title="Global settings"
      description="Configure the core financial parameters for your classroom economy."
    >
      <p className="text-muted-foreground -mt-4 text-sm">
        <strong>{props.classroomName}</strong> — changes save to this
        classroom&apos;s settings snapshot and apply on the next pay run.
      </p>

      <SettingsAlert message={formError} />

      {formSuccess !== null ? (
        <p className="border-primary bg-primary/10 text-primary border-2 p-4 text-sm font-bold">
          {formSuccess}
        </p>
      ) : null}

      <div className="grid gap-6 @min-[48rem]/admin:grid-cols-12">
        <SettingsCard className="@min-[48rem]/admin:col-span-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
              <Wallet className="text-primary size-5" aria-hidden />

              <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                Pay scale
              </p>
            </div>

            <div>
              <p className="font-heading text-xl font-bold">Default pay rate</p>

              <p className="text-muted-foreground mt-1 text-sm">
                Base hourly {draft.currencyLabel} wage for student tasks.
              </p>
            </div>
          </div>

          <label className="relative mt-6 block">
            <CentsInput
              valueCents={draft.hourlyRateCents}
              onEdit={markEditing}
              onChangeCents={cents => {
                markDraft(current => ({
                  ...current,
                  hourlyRateCents: cents,
                }))
              }}
              prefix={
                <span className="font-heading text-primary pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold">
                  K
                </span>
              }
              className="border-ink font-heading shadow-brutal h-14 border-2 pl-10 text-xl"
            />
          </label>
        </SettingsCard>

        <SettingsCard className="@min-[48rem]/admin:col-span-8">
          <div className="mb-6 grid grid-cols-[auto_1fr] items-center gap-2">
            <Percent className="text-primary size-5" aria-hidden />

            <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              Taxation &amp; savings
            </p>
          </div>

          <dl className="grid gap-6">
            <EditableSettingRow
              label="Savings APY"
              suffix="%"
              value={String(draft.savingsApyPercent)}
              onChange={value => {
                markDraft(current => ({
                  ...current,
                  savingsApyPercent: parseNumber(
                    value,
                    current.savingsApyPercent
                  ),
                }))
              }}
            />

            <EditableSettingRow
              label="401(k) percent of gross"
              suffix="%"
              value={String(draft.retirement401kPercentGross)}
              onChange={value => {
                markDraft(current => ({
                  ...current,
                  retirement401kPercentGross: parseNumber(
                    value,
                    current.retirement401kPercentGross
                  ),
                }))
              }}
            />

            <MoneySettingRow
              label="Medical insurance per pay run"
              valueCents={draft.medicalInsuranceCentsPerPayRun}
              onEdit={markEditing}
              onChangeCents={cents => {
                markDraft(current => ({
                  ...current,
                  medicalInsuranceCentsPerPayRun: cents,
                }))
              }}
            />

            <EditableSettingRow
              label="Overtime multiplier"
              suffix="×"
              value={String(draft.overtimeMultiplier)}
              onChange={value => {
                markDraft(current => ({
                  ...current,
                  overtimeMultiplier: parseNumber(
                    value,
                    current.overtimeMultiplier
                  ),
                }))
              }}
            />
          </dl>
        </SettingsCard>

        <section className="border-ink bg-card shadow-brutal overflow-hidden border-2 @min-[48rem]/admin:col-span-12">
          <div className="bg-foreground text-background grid grid-cols-[1fr_auto] items-center gap-4 p-4">
            <h3 className="text-xs font-bold tracking-widest uppercase">
              Pay period duration
            </h3>
          </div>

          <div className="divide-ink divide-y-2">
            <PayScheduleRow
              badge="W"
              title="Weekly"
              description="Processed every Friday afternoon."
              active={draft.paySchedule.type === 'weekly'}
              onSelect={() => {
                markDraft(current => ({
                  ...current,
                  paySchedule: selectPayScheduleType(
                    current.paySchedule,
                    'weekly'
                  ),
                }))
              }}
            />

            <PayScheduleRow
              badge="B"
              title="Bi-weekly"
              description={formatPaySchedule(draft.paySchedule)}
              active={draft.paySchedule.type === 'biweekly'}
              onSelect={() => {
                markDraft(current => ({
                  ...current,
                  paySchedule: selectPayScheduleType(
                    current.paySchedule,
                    'biweekly'
                  ),
                }))
              }}
            />

            <PayScheduleRow
              badge="M"
              title="Monthly"
              description="Processed on the last school day of the month."
              active={draft.paySchedule.type === 'monthly'}
              onSelect={() => {
                markDraft(current => ({
                  ...current,
                  paySchedule: selectPayScheduleType(
                    current.paySchedule,
                    'monthly'
                  ),
                }))
              }}
            />
          </div>
        </section>

        <SettingsCard className="@min-[48rem]/admin:col-span-12">
          <h3 className="font-heading mb-4 text-xl font-bold">
            Additional parameters
          </h3>

          <dl className="grid gap-4 @min-[30rem]/admin:grid-cols-2">
            <EditableSettingRow
              label="Currency label"
              value={draft.currencyLabel}
              onChange={value => {
                markDraft(current => ({ ...current, currencyLabel: value }))
              }}
            />

            <EditableSettingRow
              label="Standard day hours"
              value={String(draft.standardDayHours)}
              onChange={value => {
                markDraft(current => ({
                  ...current,
                  standardDayHours: parseNumber(
                    value,
                    current.standardDayHours
                  ),
                }))
              }}
            />

            <EditableSettingRow
              label="Payday notice lead (days)"
              value={String(draft.paydayNoticeLeadDays)}
              onChange={value => {
                markDraft(current => ({
                  ...current,
                  paydayNoticeLeadDays: parseNumber(
                    value,
                    current.paydayNoticeLeadDays
                  ),
                }))
              }}
            />

            <EditableSettingRow
              label="Vault cap"
              value={String(draft.vaultCap)}
              onChange={value => {
                markDraft(current => ({
                  ...current,
                  vaultCap: parseNumber(value, current.vaultCap),
                }))
              }}
            />
          </dl>
        </SettingsCard>
      </div>

      <div className="grid gap-4 @min-[30rem]/admin:grid-cols-[auto_auto] @min-[30rem]/admin:justify-end">
        <Button
          type="button"
          variant="brutal-outline"
          className="h-auto px-8 py-4 text-xs font-bold tracking-widest uppercase"
          disabled={!isDirty || formPending}
          onClick={() => {
            setFormError(null)
            setFormSuccess(null)
            hasLocalEditsRef.current = false
            setDraft(props.settings)
          }}
        >
          Discard changes
        </Button>

        <Button
          type="button"
          variant="brutal"
          className="h-auto px-12 py-4 text-xs font-bold tracking-widest uppercase"
          disabled={!isDirty || formPending}
          onClick={() => {
            void handleSave()
          }}
        >
          {formPending ? 'Saving…' : 'Save configuration'}
        </Button>
      </div>
    </AdminPage>
  )

  async function handleSave() {
    setFormError(null)
    setFormSuccess(null)
    setFormPending(true)

    try {
      const saved = await updateSettings({
        organizationId: props.organizationId,
        settings: draft,
      })
      hasLocalEditsRef.current = false
      setDraft(saved)
      setFormSuccess('Settings saved.')
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Could not save settings.'
      )
    } finally {
      setFormPending(false)
    }
  }
}

function CentsInput(props: {
  valueCents: number
  onChangeCents: (cents: number) => void
  onEdit: () => void
  className?: string
  prefix?: ReactNode
}) {
  const [text, setText] = useState(() => formatCentsForInput(props.valueCents))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) {
      setText(formatCentsForInput(props.valueCents))
    }
  }, [props.valueCents])

  return (
    <div className="relative">
      {props.prefix}

      <Input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onFocus={() => {
          focusedRef.current = true
        }}
        onBlur={() => {
          focusedRef.current = false
          commitCentsInput(text, props.valueCents, {
            onEdit: props.onEdit,
            onChangeCents: props.onChangeCents,
            setText,
          })
        }}
        onChange={event => {
          const next = event.target.value
          if (!isPartialDecimalInput(next)) {
            return
          }

          props.onEdit()
          setText(next)

          const cents = parseDecimalInputToCents(next)
          if (cents !== null) {
            props.onChangeCents(cents)
          }
        }}
        className={props.className}
      />
    </div>
  )
}

function MoneySettingRow(props: {
  label: string
  valueCents: number
  onChangeCents: (cents: number) => void
  onEdit: () => void
}) {
  return (
    <div className="grid gap-2">
      <dt className="text-sm font-bold">{props.label}</dt>

      <dd>
        <CentsInput
          valueCents={props.valueCents}
          onEdit={props.onEdit}
          onChangeCents={props.onChangeCents}
          prefix={
            <span className="font-heading text-primary pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-xl font-bold">
              $
            </span>
          }
          className="border-ink font-heading shadow-brutal h-11 border-2 pl-10 text-lg"
        />
      </dd>
    </div>
  )
}

function commitCentsInput(
  raw: string,
  fallbackCents: number,
  handlers: {
    onEdit: () => void
    onChangeCents: (cents: number) => void
    setText: (value: string) => void
  }
) {
  const cents = parseDecimalInputToCents(raw)
  if (cents !== null) {
    handlers.onEdit()
    handlers.onChangeCents(cents)
    handlers.setText(formatCentsForInput(cents))
    return
  }

  handlers.setText(formatCentsForInput(fallbackCents))
}

function formatCentsForInput(cents: number): string {
  return (cents / 100).toFixed(2)
}

function isPartialDecimalInput(value: string): boolean {
  return value === '' || /^\d*\.?\d{0,2}$/.test(value)
}

function parseDecimalInputToCents(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '.') {
    return null
  }

  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) {
    return null
  }

  const [wholePart, fractionPart = ''] = trimmed.split('.')
  const whole = Number(wholePart)
  const fraction = Number((fractionPart + '00').slice(0, 2))

  if (!Number.isFinite(whole) || !Number.isFinite(fraction)) {
    return null
  }

  return whole * 100 + fraction
}

function SettingsCard(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'border-ink bg-card shadow-brutal grid content-start gap-4 border-2 p-6',
        props.className
      )}
    >
      {props.children}
    </div>
  )
}
function EditableSettingRow(props: {
  label: string
  value: string
  prefix?: string
  suffix?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <dt className="text-sm font-bold">{props.label}</dt>

      <dd className="relative">
        {props.prefix ? (
          <span className="font-heading text-primary pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold">
            {props.prefix}
          </span>
        ) : null}

        <Input
          value={props.value}
          onChange={event => props.onChange(event.target.value)}
          className={cn(
            'border-ink font-heading shadow-brutal h-11 border-2 text-lg',
            props.prefix ? 'pl-10' : undefined,
            props.suffix ? 'pr-10' : undefined
          )}
        />

        {props.suffix ? (
          <span className="font-heading text-primary pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xl font-bold">
            {props.suffix}
          </span>
        ) : null}
      </dd>
    </div>
  )
}
function PayScheduleRow(props: {
  badge: string
  title: string
  description: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'grid w-full grid-cols-[1fr_auto] items-center gap-6 p-4 text-left transition-colors',
        props.active
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted/60'
      )}
      onClick={props.onSelect}
    >
      <div className="grid grid-cols-[auto_1fr] items-center gap-6">
        <div
          className={cn(
            'border-ink grid size-12 place-items-center border-2 font-bold',
            props.active ? 'bg-foreground text-background' : 'bg-muted'
          )}
        >
          {props.badge}
        </div>

        <div>
          <p className="text-sm font-bold">{props.title}</p>

          <p
            className={cn(
              'text-sm',
              props.active ? 'opacity-90' : 'text-muted-foreground'
            )}
          >
            {props.description}
          </p>
        </div>
      </div>

      {props.active ? (
        <span className="text-sm font-bold" aria-label="Active">
          ●
        </span>
      ) : null}
    </button>
  )
}
function SettingsAlert(props: { message: string | null }) {
  if (props.message === null) {
    return null
  }

  return (
    <p
      className="border-destructive bg-destructive/10 text-destructive border-2 p-4 text-sm font-bold"
      role="alert"
    >
      {props.message}
    </p>
  )
}
function parseNumber(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
function settingsDiffer(a: ClassroomSettings, b: ClassroomSettings): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}
function selectPayScheduleType(
  current: PaySchedule,
  type: 'weekly' | 'biweekly' | 'monthly'
): PaySchedule {
  switch (type) {
    case 'weekly':
      return {
        type: 'weekly',
        weekday: current.type === 'weekly' ? current.weekday : 5,
      }
    case 'biweekly':
      if (current.type === 'biweekly') {
        return current
      }

      return {
        type: 'biweekly',
        weekday: 2,
        firstPayDate: '2026-07-14',
      }
    case 'monthly':
      if (current.type === 'monthly') {
        return current
      }

      return {
        type: 'monthly',
        dayOfMonth: 28,
      }
  }
}
type ClassroomSettings = FunctionReturnType<
  typeof api.features.settings.effectiveSettingsForOrganization
>
type PaySchedule = ClassroomSettings['paySchedule']
