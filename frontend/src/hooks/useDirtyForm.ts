import { useCallback, useContext, useEffect, useState } from 'react'
import { UNSAFE_NavigationContext } from 'react-router-dom'

export default function useDirtyForm() {
  const [isDirty, setDirty] = useState(false)
  const navContext = useContext(UNSAFE_NavigationContext)
  const navigator = navContext?.navigator

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    let unblock: (() => void) | undefined
    if (isDirty && navigator && typeof (navigator as any).block === 'function') {
      unblock = (navigator as any).block((tx: any) => {
        if (window.confirm('Existem alterações não salvas')) {
          unblock?.()
          tx.retry()
        }
      })
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      unblock?.()
    }
  }, [isDirty, navigator])

  const confirmIfDirty = useCallback((): boolean => {
    if (!isDirty) return true
    const ok = window.confirm('Existem alterações não salvas')
    if (ok) setDirty(false)
    return ok
  }, [isDirty])

  return { isDirty, setDirty, confirmIfDirty }
}
