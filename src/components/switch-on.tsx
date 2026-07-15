import { Children, isValidElement } from 'react'

import type { ReactElement, ReactNode } from 'react'

Case.displayName = 'SwitchOn.Case'

/**
 * One branch in a {@link SwitchOn}. Does not render by itself; the parent reads
 * `predicate` and mounts `children` for the first matching branch.
 */
export function Case(_props: {
  predicate?: boolean | (() => boolean)
  children: ReactNode
}) {
  return null
}

/**
 * Ordered exclusive render: mounts the `children` of the first {@link Case} whose
 * `predicate` is `true`. A `Case` with no `predicate` always matches (use as the
 * final branch). Returns `null` when no case matches. Non-`Case` children are
 * skipped.
 */
export function SwitchOn(props: { children: ReactNode }) {
  for (const child of Children.toArray(props.children)) {
    if (!isCaseElement(child)) continue
    if (caseMatches(child.props.predicate)) return child.props.children
  }
  return null
}

function caseMatches(
  predicate: boolean | (() => boolean) | undefined
): boolean {
  if (predicate === undefined) return true
  return typeof predicate === 'function' ? predicate() : predicate
}

function isCaseElement(child: ReactNode): child is ReactElement<{
  predicate?: boolean | (() => boolean)
  children: ReactNode
}> {
  return isValidElement(child) && child.type === Case
}
