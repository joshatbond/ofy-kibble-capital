/**
 * Typed wrapper around @djpanda/convex-tenants `makeTenantsAPI`.
 *
 * The published factory types callbacks as `ctx: any` / `db: any` because it
 * must work with any Convex schema. This module re-binds those callbacks to
 * this app's generated {@link QueryCtx} / {@link MutationCtx}.
 *
 * Component runtimes (tenants + authz tables) stay on npm; only the app-facing
 * factory options are typed here.
 */
import { makeTenantsAPI as makeTenantsAPIBase } from '@djpanda/convex-tenants'

import type { Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'
import type { ComponentApi } from '@djpanda/convex-tenants'
import type { Auth } from 'convex/server'

/** Context passed to tenants hooks and `getUser` in this app. */
export type TenantsHandlerCtx = QueryCtx | MutationCtx

export type TypedGetUserCallback = (
  ctx: TenantsHandlerCtx,
  userId: Id<'users'>
) => Promise<{ name?: string; email?: string } | null>

type UntypedTenantsApiOptions = NonNullable<
  Parameters<typeof makeTenantsAPIBase>[1]
>

type ReplaceCallbackCtx<TCallback> = TCallback extends (
  ctx: { auth: Auth },
  ...args: infer TArgs
) => infer TReturn
  ? (ctx: Pick<QueryCtx, 'auth'>, ...args: TArgs) => TReturn
  : TCallback extends (ctx: infer _Ctx, ...args: infer TArgs) => infer TReturn
    ? (ctx: TenantsHandlerCtx, ...args: TArgs) => TReturn
    : TCallback

type TypedTenantsApiOptionsMapped = {
  [TKey in keyof UntypedTenantsApiOptions]: UntypedTenantsApiOptions[TKey] extends (
    ...args: infer _TArgs
  ) => infer _TReturn
    ? ReplaceCallbackCtx<UntypedTenantsApiOptions[TKey]>
    : UntypedTenantsApiOptions[TKey]
}

/** `makeTenantsAPI` options with callbacks tied to this app's Convex context. */
export type TypedTenantsApiOptions = Omit<
  TypedTenantsApiOptionsMapped,
  'getUser'
> & {
  getUser?: TypedGetUserCallback
}

/** Narrows tenants factory options so callback `ctx` uses {@link TenantsHandlerCtx}. */
export function defineTenantsApiOptions<
  TOptions extends TypedTenantsApiOptions,
>(options: TOptions): TOptions {
  return options
}

export function makeTypedTenantsAPI(
  component: ComponentApi,
  options: TypedTenantsApiOptions
) {
  const { getUser, ...rest } = options

  return makeTenantsAPIBase(component, {
    ...rest,
    ...(getUser
      ? {
          getUser: (ctx, userId) =>
            getUser(ctx as TenantsHandlerCtx, userId as Id<'users'>),
        }
      : {}),
  })
}
