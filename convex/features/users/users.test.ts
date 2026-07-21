import { afterEach, describe, expect, test, vi } from 'vitest'

import { api, internal } from '../../_generated/api'
import { asAuthedUser, initConvexTest } from '../../test.setup'
import {
  normalizeDisplayName,
  optionalDisplayName,
} from '../../lib/displayName'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('displayName helpers', () => {
  test('normalizeDisplayName trims and enforces length', () => {
    expect(normalizeDisplayName('  Ada  ')).toBe('Ada')
    expect(() => normalizeDisplayName('   ')).toThrow(/Name is required/)
    expect(() => normalizeDisplayName('x'.repeat(101))).toThrow(
      /100 characters or less/
    )
  })

  test('optionalDisplayName treats blank as undefined', () => {
    expect(optionalDisplayName(undefined)).toBeUndefined()
    expect(optionalDisplayName('   ')).toBeUndefined()
    expect(optionalDisplayName('  Ada  ')).toBe('Ada')
  })
})

describe('users viewer APIs', () => {
  test('viewer and viewerProfile return null when unauthenticated', async () => {
    const t = initConvexTest()

    expect(await t.query(api.features.users.viewer, {})).toBeNull()
    expect(await t.query(api.features.users.viewerProfile, {})).toBeNull()
  })

  test('viewer and viewerProfile return the signed-in user', async () => {
    const t = initConvexTest()
    const user = await asAuthedUser(t, {
      email: 'ada@ofy.org',
      name: 'Ada',
    })

    await t.run(async ctx => {
      await ctx.db.patch('users', user.userId, {
        image: 'https://example.com/ada.png',
      })
    })

    expect(await user.client.query(api.features.users.viewer, {})).toBe(
      user.userId
    )
    expect(
      await user.client.query(api.features.users.viewerProfile, {})
    ).toEqual({
      name: 'Ada',
      email: 'ada@ofy.org',
      image: 'https://example.com/ada.png',
    })
  })

  test('updateViewerProfile requires auth and validates name', async () => {
    const t = initConvexTest()
    const user = await asAuthedUser(t, {
      email: 'ada@ofy.org',
      name: 'Ada',
    })

    await expect(
      t.mutation(api.features.users.updateViewerProfile, { name: 'New Name' })
    ).rejects.toThrow(/Not authenticated/)

    await expect(
      user.client.mutation(api.features.users.updateViewerProfile, {
        name: '   ',
      })
    ).rejects.toThrow(/Name is required/)

    await expect(
      user.client.mutation(api.features.users.updateViewerProfile, {
        name: 'x'.repeat(101),
      })
    ).rejects.toThrow(/100 characters or less/)

    await user.client.mutation(api.features.users.updateViewerProfile, {
      name: '  Ada Lovelace  ',
    })

    expect(
      await user.client.query(api.features.users.viewerProfile, {})
    ).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@ofy.org',
    })
  })
})

describe('profileImage internals', () => {
  test('applyProfileImageUrl patches when the URL changes', async () => {
    const t = initConvexTest()
    const user = await asAuthedUser(t, { email: 'ada@ofy.org', name: 'Ada' })

    await t.mutation(internal.features.users.profileImage.applyProfileImageUrl, {
      userId: user.userId,
      imageUrl: 'https://lh3.googleusercontent.com/a/old',
    })

    expect(
      await t.query(internal.features.users.profileImage.getUserImage, {
        userId: user.userId,
      })
    ).toBe('https://lh3.googleusercontent.com/a/old')

    await expect(
      t.mutation(internal.features.users.profileImage.applyProfileImageUrl, {
        userId: user.userId,
        imageUrl: 'https://lh3.googleusercontent.com/a/old',
      })
    ).resolves.not.toThrow()

    expect(
      await t.query(internal.features.users.profileImage.getUserImage, {
        userId: user.userId,
      })
    ).toBe('https://lh3.googleusercontent.com/a/old')

    await t.mutation(internal.features.users.profileImage.applyProfileImageUrl, {
      userId: user.userId,
      imageUrl: 'https://lh3.googleusercontent.com/a/new',
    })

    expect(
      await t.query(internal.features.users.profileImage.getUserImage, {
        userId: user.userId,
      })
    ).toBe('https://lh3.googleusercontent.com/a/new')
  })

  test('syncProfileImageFromUrl no-ops for non-Google URLs', async () => {
    const t = initConvexTest()
    const user = await asAuthedUser(t, { email: 'ada@ofy.org', name: 'Ada' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await t.action(
      internal.features.users.profileImage.syncProfileImageFromUrl,
      {
        userId: user.userId,
        sourceUrl: 'https://example.com/not-google.png',
      }
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(
      await t.query(internal.features.users.profileImage.getUserImage, {
        userId: user.userId,
      })
    ).toBeNull()
  })

  test('syncProfileImageFromUrl skips when a non-Google image already exists', async () => {
    const t = initConvexTest()
    const user = await asAuthedUser(t, { email: 'ada@ofy.org', name: 'Ada' })
    await t.run(async ctx => {
      await ctx.db.patch('users', user.userId, {
        image: 'https://cdn.example.com/custom.png',
      })
    })

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await t.action(
      internal.features.users.profileImage.syncProfileImageFromUrl,
      {
        userId: user.userId,
        sourceUrl: 'https://lh3.googleusercontent.com/a/photo',
      }
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(
      await t.query(internal.features.users.profileImage.getUserImage, {
        userId: user.userId,
      })
    ).toBe('https://cdn.example.com/custom.png')
  })

  test('syncProfileImageFromUrl stores a fetched Google image', async () => {
    const t = initConvexTest()
    const user = await asAuthedUser(t, { email: 'ada@ofy.org', name: 'Ada' })

    const bytes = new Uint8Array([1, 2, 3, 4]).buffer
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === 'content-type' ? 'image/png' : null,
        },
        arrayBuffer: async () => bytes,
      }))
    )

    await t.action(
      internal.features.users.profileImage.syncProfileImageFromUrl,
      {
        userId: user.userId,
        sourceUrl: 'https://lh3.googleusercontent.com/a/photo',
      }
    )

    const image = await t.query(
      internal.features.users.profileImage.getUserImage,
      { userId: user.userId }
    )
    expect(image).toEqual(expect.any(String))
    expect(image).not.toContain('googleusercontent.com')
  })

  test('syncProfileImageFromUrl no-ops when fetch fails or returns non-image', async () => {
    const t = initConvexTest()
    const user = await asAuthedUser(t, { email: 'ada@ofy.org', name: 'Ada' })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        headers: { get: () => null },
        arrayBuffer: async () => new ArrayBuffer(0),
      }))
    )

    await t.action(
      internal.features.users.profileImage.syncProfileImageFromUrl,
      {
        userId: user.userId,
        sourceUrl: 'https://lh3.googleusercontent.com/a/photo',
      }
    )
    expect(
      await t.query(internal.features.users.profileImage.getUserImage, {
        userId: user.userId,
      })
    ).toBeNull()
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockClear()

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        arrayBuffer: async () => new ArrayBuffer(0),
      }))
    )

    await t.action(
      internal.features.users.profileImage.syncProfileImageFromUrl,
      {
        userId: user.userId,
        sourceUrl: 'https://lh3.googleusercontent.com/a/photo',
      }
    )
    expect(
      await t.query(internal.features.users.profileImage.getUserImage, {
        userId: user.userId,
      })
    ).toBeNull()
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockRestore()
  })

  test('backfillGoogleProfileImages schedules sync for Google avatars only', async () => {
    vi.useFakeTimers()
    const t = initConvexTest()

    const googleUser = await asAuthedUser(t, {
      email: 'google@ofy.org',
      name: 'Google',
    })
    const customUser = await asAuthedUser(t, {
      email: 'custom@ofy.org',
      name: 'Custom',
    })
    const bareUser = await asAuthedUser(t, {
      email: 'bare@ofy.org',
      name: 'Bare',
    })

    await t.run(async ctx => {
      await ctx.db.patch('users', googleUser.userId, {
        image: 'https://lh3.googleusercontent.com/a/photo',
      })
      await ctx.db.patch('users', customUser.userId, {
        image: 'https://cdn.example.com/custom.png',
      })
    })

    const bytes = new Uint8Array([9, 8, 7]).buffer
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: {
          get: () => 'image/jpeg',
        },
        arrayBuffer: async () => bytes,
      }))
    )

    const result = await t.mutation(
      internal.features.users.profileImage.backfillGoogleProfileImages,
      {}
    )
    expect(result).toEqual({ scheduled: 1 })

    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const googleImage = await t.query(
      internal.features.users.profileImage.getUserImage,
      { userId: googleUser.userId }
    )
    const customImage = await t.query(
      internal.features.users.profileImage.getUserImage,
      { userId: customUser.userId }
    )
    const bareImage = await t.query(
      internal.features.users.profileImage.getUserImage,
      { userId: bareUser.userId }
    )

    expect(googleImage).toEqual(expect.any(String))
    expect(googleImage).not.toContain('googleusercontent.com')
    expect(customImage).toBe('https://cdn.example.com/custom.png')
    expect(bareImage).toBeNull()
  })
})
