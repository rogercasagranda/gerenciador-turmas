import { useEffect } from 'react'
import useBaseNavigate from '@/hooks/useBaseNavigate'
import { setAuthToken } from '@/services/api'

const OAuthOk: React.FC = () => {
  const navigate = useBaseNavigate()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setAuthToken(token, true)
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete('token')
        window.history.replaceState({}, document.title, url.toString())
      } catch {}
    }
    navigate('/home')
  }, [navigate])
  return <div>Processando login...</div>
}

export default OAuthOk
