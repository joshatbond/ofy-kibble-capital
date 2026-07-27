import type { FunctionReturnType } from 'convex/server'

import type { api } from '~/convex/_generated/api'

type Vault = NonNullable<
  FunctionReturnType<typeof api.features.vaults.getMyVault>
>

export function fundingModeLabel(vault: Pick<
  Vault,
  'fundingMode' | 'onDepositRule' | 'scheduledAmountCents' | 'scheduleCadence'
>): string {
  switch (vault.fundingMode) {
    case 'manual':
      return 'Manual'
    case 'on_deposit': {
      const rule = vault.onDepositRule
      if (rule?.kind === 'percent') {
        return `On deposit · ${rule.percent}%`
      }
      if (rule?.kind === 'fixed') {
        return 'On deposit · fixed'
      }
      return 'On deposit'
    }
    case 'scheduled': {
      const cadence =
        vault.scheduleCadence === 'biweekly'
          ? 'bi-weekly'
          : vault.scheduleCadence === 'monthly'
            ? 'monthly'
            : 'weekly'
      return `Scheduled · ${cadence}`
    }
  }
}
