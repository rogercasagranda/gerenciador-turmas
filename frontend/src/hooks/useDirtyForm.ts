import { useCallback, useEffect, useState } from 'react'

export default function useDirtyForm() {
  const [isDirty, setDirty] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    const handlePopState = (e: PopStateEvent) => {
      if (isDirty && !window.confirm('Existem alterações não salvas')) {
        e.preventDefault()
        history.pushState(null, '', window.location.href)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isDirty])

  const confirmIfDirty = useCallback((): boolean => {
    if (!isDirty) return true
    return window.confirm('Existem alterações não salvas')
  }, [isDirty])

  return { isDirty, setDirty, confirmIfDirty }
}
