import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { apiFetch, getAuthToken, clearAuthToken } from '@/services/api'
import useBaseNavigate from '@/hooks/useBaseNavigate'

interface Props {
  children: React.ReactElement
}

/**
 * Protege rotas verificando existência e validade do token.
 * - Sem token: redireciona para login sem chamar /me
 * - Com token: renderiza children e valida /me de forma lazy
 * - 401 no /me: limpa storage e redireciona para login
 */
const PrivateRoute: React.FC<Props> = ({ children }) => {
  const navigate = useBaseNavigate()
  const token = getAuthToken()

  useEffect(() => {
    if (!token) return
    let active = true
    apiFetch('/me').catch((err: any) => {
      if (!active) return
      if (err?.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
      }
    })
    return () => {
      active = false
    }
  }, [token, navigate])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default PrivateRoute
