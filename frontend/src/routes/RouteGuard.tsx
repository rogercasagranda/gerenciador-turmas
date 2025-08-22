import React, { useEffect, useState, useCallback } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { apiFetch, getAuthToken } from '@/services/api'
import useBaseNavigate from '@/hooks/useBaseNavigate'

interface Props {
  children: React.ReactElement
}

const RouteGuard: React.FC<Props> = ({ children }) => {
  const navigate = useBaseNavigate()
  const location = useLocation()
  const token = getAuthToken()

  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({})
  const [loaded, setLoaded] = useState(false)

  const fetchPermissions = useCallback(() => {
    apiFetch('/me/permissions/effective')
      .then((data: Record<string, Record<string, boolean>>) => {
        const perms = data || {}
        setPermissions(perms)
        try { localStorage.setItem('permissions.effective', JSON.stringify(perms)) } catch {}
      })
      .catch(() => {
        setPermissions({})
        try { localStorage.removeItem('permissions.effective') } catch {}
      })
      .finally(() => {
        setLoaded(true)
        window.dispatchEvent(new Event('permissions:updated'))
      })
  }, [])

  useEffect(() => {
    fetchPermissions()
    const handler = () => fetchPermissions()
    window.addEventListener('permissions:refresh', handler)
    return () => window.removeEventListener('permissions:refresh', handler)
  }, [fetchPermissions])

  useEffect(() => {
    const handler = () => navigate('/login')
    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [navigate])

  if (!token) {
    console.warn('[auth] token ausente, redirecionando para /login')
    return <Navigate to="/login" replace />
  }

  if (!loaded) {
    return null
  }

  const path = location.pathname.toLowerCase()
  const base = path.split('?')[0]
  const hasView = !!permissions[base]?.view
  if (base !== '/home' && base !== '/403' && !hasView) {
    console.warn('[auth] acesso negado à rota', base, '→ redirecionando para /403')
    return <Navigate to="/403" replace />
  }

  return children
}

export default RouteGuard
