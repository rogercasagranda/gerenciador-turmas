import React, { useEffect, useState, useCallback } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { apiFetch, getAuthToken, clearAuthToken } from '@/services/api'
import useBaseNavigate from '@/hooks/useBaseNavigate'

interface Props {
  children: React.ReactElement
}

const RouteGuard: React.FC<Props> = ({ children }) => {
  const navigate = useBaseNavigate()
  const location = useLocation()
  const token = getAuthToken()

  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>> | string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [user, setUser] = useState<any>(null)

  const fetchSession = useCallback(async () => {
    try {
      const u = await apiFetch('/me')
      const perms = await apiFetch('/me/permissions/effective')
      setUser(u)
      setPermissions(perms)
      try { localStorage.setItem('permissions.effective', JSON.stringify(perms)) } catch {}
    } catch {
      clearAuthToken()
      navigate('/login')
    } finally {
      setLoaded(true)
      window.dispatchEvent(new Event('permissions:updated'))
    }
  }, [navigate])

  useEffect(() => {
    fetchSession()
    const handler = () => fetchSession()
    window.addEventListener('permissions:refresh', handler)
    return () => window.removeEventListener('permissions:refresh', handler)
  }, [fetchSession])

  useEffect(() => {
    const handler = () => {
      clearAuthToken()
      navigate('/login')
    }
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
  const isMaster = (user?.is_master) || (Array.isArray(permissions) && permissions.includes('*'))
  const hasView = isMaster ? true : !!(permissions as any)[base]?.view
  if (!isMaster && base !== '/home' && base !== '/403' && !hasView) {
    console.warn('[auth] acesso negado à rota', base)
  }

  return children
}

export default RouteGuard
