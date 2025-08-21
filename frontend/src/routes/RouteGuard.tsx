import React, { useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { getAuthToken } from '@/services/api'

interface Props {
  children: React.ReactElement
}

const RouteGuard: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = getAuthToken()

  const permissions = useMemo(() => {
    try {
      const raw = localStorage.getItem('permissions.effective')
      return new Set<string>(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set<string>()
    }
  }, [])

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
  if (base.startsWith('/configuracao') && !permissions.has(base) && base !== '/403') {
    console.warn('Acesso negado à rota', base)
    return <Navigate to="/403" replace />
  }

  return children
}

export default RouteGuard
