import { describe, expect, test } from 'vitest'

import { api, internal } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'

import { V1_BASE_SETTINGS } from './defaults'
import { mergeSettingsLayers } from './merge'
import {
  assertClassSettings,
  assertPaySchedule,
  assertPaydayNoticeLeadDays,
  pickSettingsValues,
} from './values'

import type { SettingsValues } from './values'

describe('settings helpers', () => {
  test('mergeSettingsLayers applies region → site → classroom precedence', () => {
    const region = V1_BASE_SETTINGS
    const site: SettingsValues = {
      ...region,
      savingsApyPercent: 4.1,
      vaultCap: 3,
    }
    const classroom = {
      vaultCap: 7,
      currencyLabel: 'Class Bucks',
    }

    expect(mergeSettingsLayers(region, site, classroom)).toMatchObject({
      hourlyRateCents: 1500,
      savingsApyPercent: 4.1,
      vaultCap: 7,
      currencyLabel: 'Class Bucks',
    })
  })

  test('pickSettingsValues drops non-settings fields', () => {
    expect(
      pickSettingsValues({
        ...V1_BASE_SETTINGS,
        _id: 'ignore-me',
        _creationTime: 123,
        regionId: 'also-ignore',
      })
    ).toEqual(V1_BASE_SETTINGS)
  })

  test('assertClassSettings and payday lead enforce product bounds', () => {
    expect(() => assertClassSettings(V1_BASE_SETTINGS)).not.toThrow()

    expect(() =>
      assertClassSettings({ ...V1_BASE_SETTINGS, hourlyRateCents: 0 })
    ).toThrow(/Hourly rate/)
    expect(() =>
      assertClassSettings({ ...V1_BASE_SETTINGS, standardDayHours: 0 })
    ).toThrow(/Standard day hours/)
    expect(() =>
      assertClassSettings({ ...V1_BASE_SETTINGS, savingsApyPercent: -1 })
    ).toThrow(/Savings APY/)
    expect(() =>
      assertClassSettings({
        ...V1_BASE_SETTINGS,
        retirement401kPercentGross: 101,
      })
    ).toThrow(/401\(k\)/)
    expect(() =>
      assertClassSettings({
        ...V1_BASE_SETTINGS,
        medicalInsuranceCentsPerPayRun: -1,
      })
    ).toThrow(/Medical insurance/)
    expect(() =>
      assertClassSettings({ ...V1_BASE_SETTINGS, overtimeMultiplier: 0.9 })
    ).toThrow(/Overtime multiplier/)
    expect(() =>
      assertClassSettings({ ...V1_BASE_SETTINGS, currencyLabel: '   ' })
    ).toThrow(/Currency label/)
    expect(() =>
      assertClassSettings({ ...V1_BASE_SETTINGS, vaultCap: 0 })
    ).toThrow(/Vault cap/)

    expect(() => assertPaydayNoticeLeadDays(1)).not.toThrow()
    expect(() => assertPaydayNoticeLeadDays(7)).not.toThrow()
    expect(() => assertPaydayNoticeLeadDays(0)).toThrow(/Payday notice lead/)
    expect(() => assertPaydayNoticeLeadDays(8)).toThrow(/Payday notice lead/)
  })

  test('assertPaySchedule rejects biweekly firstPayDate off weekday', () => {
    expect(() =>
      assertPaySchedule({
        type: 'biweekly',
        weekday: 5,
        firstPayDate: '2025-07-15',
      })
    ).toThrow(/firstPayDate.*must fall on weekday/)

    expect(() =>
      assertPaySchedule({
        type: 'biweekly',
        weekday: 2,
        firstPayDate: '2026-07-14',
      })
    ).not.toThrow()
  })
})

describe('effectiveSettingsForOrganization', () => {
  test('requires a signed-in teacher for the organization', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)

    await expect(
      t.query(api.features.settings.effectiveSettingsForOrganization, {
        organizationId,
      })
    ).rejects.toThrow(/Not authenticated/)

    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })
    await expect(
      stranger.client.query(
        api.features.settings.effectiveSettingsForOrganization,
        { organizationId }
      )
    ).rejects.toThrow()
  })

  test('returns the seeded classroom settings snapshot', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const settings = await teacher.client.query(
      api.features.settings.effectiveSettingsForOrganization,
      { organizationId }
    )

    expect(settings).toMatchObject({
      hourlyRateCents: 1500,
      standardDayHours: 4,
      savingsApyPercent: 3.3,
      retirement401kPercentGross: 5,
      medicalInsuranceCentsPerPayRun: 2500,
      overtimeMultiplier: 1.5,
      paydayNoticeLeadDays: 4,
      currencyLabel: 'Bark Bucks',
      vaultCap: 5,
      paySchedule: {
        type: 'biweekly',
        weekday: 2,
        firstPayDate: '2026-07-14',
      },
    })

    expect(
      await t.query(
        internal.features.settings.effectiveSettingsForOrganizationInternal,
        { organizationId }
      )
    ).toEqual(settings)
  })
})

describe('updateClassSettingsForOrganization', () => {
  test('requires teacher organizations:update and validates values', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    await expect(
      t.mutation(api.features.settings.updateClassSettingsForOrganization, {
        organizationId,
        settings: V1_BASE_SETTINGS,
      })
    ).rejects.toThrow(/Not authenticated/)

    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })
    await expect(
      stranger.client.mutation(
        api.features.settings.updateClassSettingsForOrganization,
        {
          organizationId,
          settings: V1_BASE_SETTINGS,
        }
      )
    ).rejects.toThrow()

    await expect(
      teacher.client.mutation(
        api.features.settings.updateClassSettingsForOrganization,
        {
          organizationId,
          settings: { ...V1_BASE_SETTINGS, vaultCap: 0 },
        }
      )
    ).rejects.toThrow(/Vault cap/)
  })

  test('persists classroom overrides and exposes them via effective settings', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const next: SettingsValues = {
      ...V1_BASE_SETTINGS,
      hourlyRateCents: 1750,
      savingsApyPercent: 4.25,
      vaultCap: 8,
      currencyLabel: 'Class Bark Bucks',
      paydayNoticeLeadDays: 3,
    }

    const saved = await teacher.client.mutation(
      api.features.settings.updateClassSettingsForOrganization,
      {
        organizationId,
        settings: next,
      }
    )
    expect(saved).toEqual(next)

    expect(
      await teacher.client.query(
        api.features.settings.effectiveSettingsForOrganization,
        { organizationId }
      )
    ).toEqual(next)
  })

  test.each([
    {
      name: 'biweekly firstPayDate off weekday',
      paySchedule: {
        type: 'biweekly' as const,
        weekday: 5,
        firstPayDate: '2025-07-15',
      },
      message: /firstPayDate.*must fall on weekday/,
    },
    {
      name: 'weekly invalid weekday',
      paySchedule: {
        type: 'weekly' as const,
        weekday: 7,
      },
      message: /weekday must be an integer/,
    },
    {
      name: 'semi_monthly wrong day count',
      paySchedule: {
        type: 'semi_monthly' as const,
        daysOfMonth: [15],
      },
      message: /exactly two days/,
    },
    {
      name: 'monthly day out of range',
      paySchedule: {
        type: 'monthly' as const,
        dayOfMonth: 32,
      },
      message: /between 1 and 31/,
    },
  ])(
    'rejects invalid pay schedule: $name',
    async ({ paySchedule, message }) => {
      const t = initConvexTest()
      const { teacher, organizationId } = await setupDevTeacherClassroom(t)

      await expect(
        teacher.client.mutation(
          api.features.settings.updateClassSettingsForOrganization,
          {
            organizationId,
            settings: {
              ...V1_BASE_SETTINGS,
              paySchedule,
            },
          }
        )
      ).rejects.toThrow(message)
    }
  )
})
