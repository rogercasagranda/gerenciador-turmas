import { useEffect } from 'react'

export default function GoogleCallback() {
  useEffect(() => {
    // Ex.: "#/auth/callback?token=...&t=..."
    const hash = window.location.hash || ''
    const qs = hash.split('?')[1] || ''
    const params = new URLSearchParams(qs)
    const token = params.get('token')
    const persist = sessionStorage.getItem('login:persist') === '1'
    if (token) {
      if (persist) localStorage.setItem('authToken', token)
      else sessionStorage.setItem('authToken', token)
    }
    sessionStorage.removeItem('login:persist')
    window.location.replace('#/home')
  }, [])

  return null
}

