import { expect, test } from 'vitest'

import { initConvexTest } from './test.setup'

test('convex-test boots with schema and components', async () => {
  const t = initConvexTest()

  const inserted = await t.run(async ctx => {
    return await ctx.db.insert('regions', {
      name: 'Smoke Region',
      slug: 'smoke-region',
    })
  })

  const region = await t.run(async ctx => {
    return await ctx.db.get(inserted)
  })

  expect(region).toMatchObject({
    name: 'Smoke Region',
    slug: 'smoke-region',
  })
})
