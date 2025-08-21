import React, { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getAuthToken } from '@/services/api'

interface Props {
  children: React.ReactElement
}

const RouteGuard: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate()
  const token = getAuthToken()

  useEffect(() => {
    const handler = () => navigate('/login')
    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [navigate])

  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default RouteGuard
