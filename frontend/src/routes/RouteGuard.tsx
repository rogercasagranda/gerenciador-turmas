import React, { useEffect, useState, useCallback } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { getAuthToken } from '@/services/api'

interface Props {
  children: React.ReactElement
}

const RouteGuard: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = getAuthToken()

  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({})

  const loadPermissions = useCallback(() => {
    try {
      const raw = localStorage.getItem('permissions.effective')
      setPermissions(raw ? JSON.parse(raw) : {})
    } catch {
      setPermissions({})
    }
  }, [])

  useEffect(() => {
    loadPermissions()
    const handler = () => loadPermissions()
    window.addEventListener('permissions:refresh', handler)
    return () => window.removeEventListener('permissions:refresh', handler)
  }, [loadPermissions])

  useEffect(() => {
    const handler = () => navigate('/login')
    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [navigate])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const path = location.pathname.toLowerCase()
  const base = path.split('?')[0]
  const hasView = !!permissions[base]?.view
  if (base.startsWith('/configuracao') && !hasView && base !== '/403') {
    console.warn('Acesso negado à rota', base)
    return <Navigate to="/403" replace />
  }

  return children
}

export default RouteGuard
