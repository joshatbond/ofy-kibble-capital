import { afterEach, describe, expect, test, vi } from 'vitest'

import { api } from '../../_generated/api'
import { asAuthedUser, initConvexTest } from '../../test.setup'

import { isLocalDevDeployment } from './devOnly'
import { resolvePostAuthRedirect } from './redirect'
import {
  studentAppFromPathname,
  studentAppFromRedirectTo,
} from './studentApp'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('studentApp helpers', () => {
  test('maps kibble and pawket pathnames', () => {
    expect(studentAppFromPathname('/kibble')).toBe('kibble')
    expect(studentAppFromPathname('/kibble/pay')).toBe('kibble')
    expect(studentAppFromPathname('/pawket')).toBe('pawket')
    expect(studentAppFromPathname('/pawket/savings')).toBe('pawket')
    expect(studentAppFromPathname('/admin')).toBeNull()
    expect(studentAppFromPathname('/')).toBeNull()
  })

  test('maps redirectTo absolute and relative URLs', () => {
    expect(studentAppFromRedirectTo('/pawket/landing')).toBe('pawket')
    expect(
      studentAppFromRedirectTo('https://example.com/kibble/?x=1')
    ).toBe('kibble')
    expect(studentAppFromRedirectTo('https://example.com/admin/')).toBeNull()
  })
})

describe('resolvePostAuthRedirect', () => {
  test('requires SITE_URL (or ALLOWED_SITE_URLS)', () => {
    vi.stubEnv('SITE_URL', '')
    vi.stubEnv('ALLOWED_SITE_URLS', '')

    expect(() => resolvePostAuthRedirect('/kibble/')).toThrow(
      /SITE_URL is not configured/
    )
  })

  test('normalizes allowed app paths against SITE_URL', () => {
    vi.stubEnv('SITE_URL', 'http://localhost:3000')

    expect(resolvePostAuthRedirect('/kibble')).toBe(
      'http://localhost:3000/kibble/'
    )
    expect(resolvePostAuthRedirect('/pawket/landing')).toBe(
      'http://localhost:3000/pawket/'
    )
    expect(resolvePostAuthRedirect('/admin/landing')).toBe(
      'http://localhost:3000/admin/'
    )
    expect(resolvePostAuthRedirect('/invite/abc')).toBe(
      'http://localhost:3000/invite/abc'
    )
  })

  test('falls back to /kibble/ for disallowed paths', () => {
    vi.stubEnv('SITE_URL', 'http://localhost:3000')

    expect(resolvePostAuthRedirect('/evil')).toBe(
      'http://localhost:3000/kibble/'
    )
    expect(resolvePostAuthRedirect(null)).toBe('http://localhost:3000/kibble/')
  })

  test('preserves matching absolute origin and query', () => {
    vi.stubEnv('SITE_URL', 'http://localhost:3000')
    vi.stubEnv('ALLOWED_SITE_URLS', 'https://app.example.com')

    expect(
      resolvePostAuthRedirect('https://app.example.com/pawket?from=invite')
    ).toBe('https://app.example.com/pawket/?from=invite')
  })
})

describe('isLocalDevDeployment', () => {
  test('is true for localhost SITE_URL or explicit flags', () => {
    vi.stubEnv('SITE_URL', 'http://localhost:3000')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')
    expect(isLocalDevDeployment()).toBe(true)

    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', 'true')
    expect(isLocalDevDeployment()).toBe(true)

    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', 'true')
    expect(isLocalDevDeployment()).toBe(true)
  })

  test('is false for non-local production-like SITE_URL', () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')
    expect(isLocalDevDeployment()).toBe(false)
  })
})

describe('devPassword.isEnabled', () => {
  test('mirrors isLocalDevDeployment for the public query', async () => {
    const t = initConvexTest()

    vi.stubEnv('SITE_URL', 'http://localhost:3000')
    expect(await t.query(api.features.auth.devPassword.isEnabled, {})).toBe(
      true
    )

    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')
    expect(await t.query(api.features.auth.devPassword.isEnabled, {})).toBe(
      false
    )
  })
})

describe('studentAuth', () => {
  test('recordOAuthStudentApp stores intent for kibble/pawket redirects', async () => {
    const t = initConvexTest()
    const verifierId = await t.run(async ctx => {
      return await ctx.db.insert('authVerifiers', {})
    })

    await t.mutation(api.features.auth.studentAuth.recordOAuthStudentApp, {
      verifierId,
      redirectTo: '/pawket/landing',
    })

    const intent = await t.run(async ctx => {
      return await ctx.db
        .query('studentOAuthIntents')
        .withIndex('by_verifier', q => q.eq('verifierId', verifierId))
        .unique()
    })

    expect(intent).toMatchObject({
      verifierId,
      studentApp: 'pawket',
    })
    expect(intent!.expirationTime).toBeGreaterThan(Date.now())
  })

  test('recordOAuthStudentApp rejects non-student redirects and missing verifiers', async () => {
    const t = initConvexTest()
    const verifierId = await t.run(async ctx => {
      return await ctx.db.insert('authVerifiers', {})
    })

    await expect(
      t.mutation(api.features.auth.studentAuth.recordOAuthStudentApp, {
        verifierId,
        redirectTo: '/admin/',
      })
    ).rejects.toThrow(/redirectTo must target \/kibble or \/pawket/)

    const deletedVerifierId = await t.run(async ctx => {
      const id = await ctx.db.insert('authVerifiers', {})
      await ctx.db.delete('authVerifiers', id)
      return id
    })

    await expect(
      t.mutation(api.features.auth.studentAuth.recordOAuthStudentApp, {
        verifierId: deletedVerifierId,
        redirectTo: '/kibble/',
      })
    ).rejects.toThrow(/Invalid OAuth verifier/)
  })

  test('applyOAuthStudentApp patches session from intent and clears the intent', async () => {
    const t = initConvexTest()
    const { client, sessionId } = await asAuthedUser(t)

    const verifierId = await t.run(async ctx => {
      const verifierId = await ctx.db.insert('authVerifiers', {})
      await ctx.db.insert('studentOAuthIntents', {
        verifierId,
        studentApp: 'kibble',
        expirationTime: Date.now() + 60_000,
      })
      return verifierId
    })

    const applied = await client.mutation(
      api.features.auth.studentAuth.applyOAuthStudentApp,
      { verifierId }
    )
    expect(applied).toBe('kibble')

    const session = await t.run(async ctx => {
      return await ctx.db.get('authSessions', sessionId)
    })
    expect(session?.studentApp).toBe('kibble')

    const intent = await t.run(async ctx => {
      return await ctx.db
        .query('studentOAuthIntents')
        .withIndex('by_verifier', q => q.eq('verifierId', verifierId))
        .unique()
    })
    expect(intent).toBeNull()
  })

  test('applyOAuthStudentApp uses fallback when intent is missing or expired', async () => {
    const t = initConvexTest()
    const { client, sessionId } = await asAuthedUser(t)

    const applied = await client.mutation(
      api.features.auth.studentAuth.applyOAuthStudentApp,
      { fallbackPathname: '/pawket/savings' }
    )
    expect(applied).toBe('pawket')

    const session = await t.run(async ctx => {
      return await ctx.db.get('authSessions', sessionId)
    })
    expect(session?.studentApp).toBe('pawket')
  })

  test('applyOAuthStudentApp returns existing session app without rewriting', async () => {
    const t = initConvexTest()
    const { client } = await asAuthedUser(t, { studentApp: 'kibble' })

    const applied = await client.mutation(
      api.features.auth.studentAuth.applyOAuthStudentApp,
      { fallbackPathname: '/pawket/' }
    )
    expect(applied).toBe('kibble')
  })

  test('applyOAuthStudentApp and currentStudentApp return null when unauthenticated', async () => {
    const t = initConvexTest()

    expect(
      await t.mutation(api.features.auth.studentAuth.applyOAuthStudentApp, {
        fallbackPathname: '/kibble/',
      })
    ).toBeNull()

    expect(
      await t.query(api.features.auth.studentAuth.currentStudentApp, {})
    ).toBeNull()
  })

  test('currentStudentApp returns the session studentApp', async () => {
    const t = initConvexTest()
    const { client } = await asAuthedUser(t, { studentApp: 'pawket' })

    expect(
      await client.query(api.features.auth.studentAuth.currentStudentApp, {})
    ).toBe('pawket')
  })
})
