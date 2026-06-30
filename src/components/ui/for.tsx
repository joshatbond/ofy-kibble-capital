import { Fragment } from 'react'

import type { Key, ReactNode } from 'react'

export function For<T>(props: {
  data: ReadonlyArray<T>
  getKey: (item: T, index: number) => Key
  children: (item: T, index: number) => ReactNode
  fallback?: ReactNode
}) {
  if (props.data.length === 0) {
    return props.fallback ?? null
  }

  return (
    <>
      {props.data.map((item, index) => (
        <Fragment key={props.getKey(item, index)}>
          {props.children(item, index)}
        </Fragment>
      ))}
    </>
  )
}
