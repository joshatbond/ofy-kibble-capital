import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { AdminNav } from '~/components/admin/admin-nav'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'
import { formatCents, formatPaySchedule } from '~/lib/format-money'

export const Route = createFileRoute('/admin/$orgId/')({
  component: AdminOrgPage,
})

function AdminOrgPage() {
  const params = Route.useParams()
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext
  )
  const settings = useQuery(
    api.features.settings.effectiveSettingsForOrganization,
    {
      organizationId: params.orgId,
    }
  )

  const orgMismatch =
    context !== undefined &&
    context !== null &&
    context.organizationId !== params.orgId

  return (
    <SwitchOn>
      <Case predicate={context === undefined || settings === undefined}>
        <main>
          <p>Loading classroom settings…</p>
        </main>
      </Case>

      <Case predicate={context === null}>
        <main>
          <p>No classroom found for your account.</p>
        </main>
      </Case>

      <Case predicate={orgMismatch}>
        <main>
          <p>This classroom does not match your teacher account.</p>

          <p>
            <Link to="/admin">Back to dashboard</Link>
          </p>
        </main>
      </Case>

      <Case>
        <AdminOrgSettings />
      </Case>
    </SwitchOn>
  )
}

function AdminOrgSettings() {
  const params = Route.useParams()
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext
  )
  const settings = useQuery(
    api.features.settings.effectiveSettingsForOrganization,
    {
      organizationId: params.orgId,
    }
  )

  if (context === undefined || context === null || settings === undefined) {
    return null
  }

  return (
    <main>
      <h1>Classroom settings</h1>

      <p>
        <strong>{context.classroomName}</strong> — effective economy settings
        merged from region, school site, and classroom snapshot.
      </p>

      <AdminNav
        organizationId={context.organizationId}
        classroomId={context.classroomId}
        current="settings"
      />

      <section>
        <h2>Settings stack</h2>

        <p>
          Defaults flow region → school site → classroom. Classroom values
          captured at create override lower layers for that field. Site-wide
          settings propagation is not in v1 — teachers set classroom values
          directly when editing is available.
        </p>

        <p>
          <em>Editing settings will be available in a future update.</em>
        </p>
      </section>

      <section>
        <h2>Effective settings</h2>

        <dl>
          <dt>Currency label</dt>

          <dd>{settings.currencyLabel}</dd>

          <dt>Hourly rate</dt>

          <dd>{formatCents(settings.hourlyRateCents)}</dd>

          <dt>Standard day hours</dt>

          <dd>{settings.standardDayHours}</dd>

          <dt>Pay schedule</dt>

          <dd>{formatPaySchedule(settings.paySchedule)}</dd>

          <dt>Savings APY</dt>

          <dd>{settings.savingsApyPercent}%</dd>

          <dt>401(k) percent of gross</dt>

          <dd>{settings.retirement401kPercentGross}%</dd>

          <dt>Medical insurance per pay run</dt>

          <dd>{formatCents(settings.medicalInsuranceCentsPerPayRun)}</dd>

          <dt>Overtime multiplier</dt>

          <dd>{settings.overtimeMultiplier}×</dd>

          <dt>Payday notice lead (calendar days)</dt>

          <dd>{settings.paydayNoticeLeadDays}</dd>

          <dt>Vault cap</dt>

          <dd>{settings.vaultCap}</dd>
        </dl>
      </section>

      <p>
        <Link
          to="/admin/$orgId/$classId"
          params={{
            orgId: context.organizationId,
            classId: context.classroomId,
          }}
        >
          Classroom roster &amp; invitations
        </Link>
      </p>
    </main>
  )
}
