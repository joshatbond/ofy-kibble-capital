import { Children, isValidElement } from 'react'

import type { ReactElement, ReactNode } from 'react'

/**
 * One branch in a {@link SwitchOn}. Does not render by itself; the parent reads
 * `predicate` and mounts `children` for the first matching branch.
 *
 * **Boolean mode** (no `value` on `SwitchOn`): `predicate` is a boolean or
 * `() => boolean`; `children` is a `ReactNode`.
 *
 * **Value mode** (`SwitchOn value={…}`): `predicate` may be a type guard
 * `(value: T) => value is TNarrowed`; `children` may be
 * `(value: TNarrowed) => ReactNode` so the matched value is narrowed in the
 * callback.
 */
export const Case: CaseComponent = Object.assign(
  function SwitchOnCase() {
    return null
  },
  { displayName: 'SwitchOn.Case' }
)

/**
 * Ordered exclusive render: mounts the `children` of the first {@link Case}
 * whose `predicate` matches. A `Case` with no `predicate` always matches (use
 * as the final branch). Returns `null` when no case matches. Non-`Case`
 * children are skipped.
 *
 * Pass `value` to enable type-guard predicates and render-function children
 * that receive the (possibly narrowed) value.
 */
export const SwitchOn: {
  (props: { children: ReactNode }): ReactNode
  <T>(props: { value: T; children: ReactNode }): ReactNode
} = function SwitchOn<T>(props: { value?: T; children: ReactNode }) {
  const hasValue = Object.hasOwn(props, 'value')

  for (const child of Children.toArray(props.children)) {
    if (!isCaseElement(child)) continue
    if (!caseMatches(child.props.predicate, hasValue, props.value)) continue

    return resolveChildren(child.props.children, hasValue, props.value)
  }

  return null
}

function caseMatches(
  predicate: CaseElementProps['predicate'],
  hasValue: boolean,
  value: unknown
): boolean {
  if (predicate === undefined) return true
  if (typeof predicate === 'function') {
    return Boolean(hasValue ? predicate(value) : (predicate as () => boolean))
  }

  return predicate
}

function resolveChildren(
  children: CaseElementProps['children'],
  hasValue: boolean,
  value: unknown
): ReactNode {
  if (typeof children === 'function') {
    return hasValue ? children(value) : (children as () => ReactNode)()
  }
  return children
}

function isCaseElement(
  child: ReactNode
): child is ReactElement<CaseElementProps> {
  return isValidElement(child) && child.type === Case
}

type BooleanPredicate = boolean | (() => boolean)

type CaseElementProps = {
  predicate?: BooleanPredicate | ((value: unknown) => boolean)
  children: ReactNode | ((value: unknown) => ReactNode)
}

type CaseComponent = {
  (props: { predicate?: BooleanPredicate; children: ReactNode }): null
  <T, TNarrowed extends T>(props: {
    predicate: (value: T) => value is TNarrowed
    children: (value: TNarrowed) => ReactNode
  }): null
  <T>(props: {
    predicate?: (value: T) => boolean
    children: (value: T) => ReactNode
  }): null
  displayName?: string
}
