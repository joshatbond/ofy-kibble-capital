import type { api } from '~/convex/_generated/api'

import type { FunctionReturnType } from 'convex/server'

/** UI projection of an admin paystub line into expandable breakdown panels. */
export function studentPayBreakdown(
  stub: AdminPaystubLine
): StudentPayBreakdown {
  const pretaxTotal = stub.retirement401kCents + stub.medicalInsuranceCents
  const taxTotal =
    stub.federalIncomeTaxCents +
    stub.californiaIncomeTaxCents +
    stub.socialSecurityCents +
    stub.medicareCents +
    stub.caSdiCents

  return {
    panels: [
      {
        title: 'gross pay',
        amountCents: stub.grossPayCents,
        accentColor: 'text-emerald-700',
        groups: [
          {
            title: 'Regular',
            fields: [
              { label: 'hours', value: String(stub.baseHours) },
              { label: 'rate', cents: stub.regularRateCents },
              { label: 'amount', cents: stub.basePayCents },
            ],
          },
          {
            title: 'Overtime',
            fields: [
              { label: 'hours', value: String(stub.overtimeHours) },
              { label: 'rate', cents: stub.overtimeRateCents },
              { label: 'amount', cents: stub.overtimePayCents },
            ],
          },
        ],
      },
      {
        title: 'taxes and deductions',
        amountCents: pretaxTotal + taxTotal,
        accentColor: 'text-destructive',
        groups: [
          {
            title: 'Pre-tax deductions',
            fields: [
              { label: '401(k)', cents: stub.retirement401kCents },
              { label: 'Medical insurance', cents: stub.medicalInsuranceCents },
              { label: 'amount', cents: pretaxTotal },
            ],
          },
          {
            title: 'taxes',
            fields: [
              { label: 'social security', cents: stub.socialSecurityCents },
              { label: 'medicare', cents: stub.medicareCents },
              { label: 'federal withholding', cents: stub.federalIncomeTaxCents },
              {
                label: 'State withholdings',
                cents: stub.californiaIncomeTaxCents,
              },
              { label: 'CA SDI', cents: stub.caSdiCents },
              { label: 'amount', cents: taxTotal },
            ],
          },
        ],
      },
    ],
  }
}

export type PayRunAdminReport = FunctionReturnType<
  typeof api.features.payroll.getPayRunAdminReportForOrganization
>

export type AdminPaystubLine = PayRunAdminReport['stubs'][number]

/** Text field in a paystub breakdown group (hours string or money cents). */
export type PayBreakdownField =
  | { label: string; value: string }
  | { label: string; cents: number }

export type PayBreakdownGroupData = {
  title: string
  fields: Array<PayBreakdownField>
}

export type PayBreakdownPanelData = {
  title: string
  amountCents: number
  accentColor: string
  groups: Array<PayBreakdownGroupData>
}

export type StudentPayBreakdown = {
  panels: Array<PayBreakdownPanelData>
}
