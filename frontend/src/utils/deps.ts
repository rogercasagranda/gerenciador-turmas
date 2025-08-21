import type { ComponentType, FC } from 'react'

export function withOngoingPull<P>(Component: ComponentType<P>): FC<P> {
  return function WrappedWithOngoingPull(props: P) {
    return <Component {...props} />
  }
}

