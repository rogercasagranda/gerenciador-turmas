import { useEffect } from 'react'

const GoogleCallback: React.FC = () => {
  useEffect(() => {
    const hash = window.location.hash
    const query = hash.includes('?') ? hash.split('?')[1] : ''
    const params = new URLSearchParams(query)
    const token = params.get('token')
    const persist = sessionStorage.getItem('login:persist') === '1'
    if (token) {
      if (persist) {
        localStorage.setItem('authToken', token)
      } else {
        sessionStorage.setItem('authToken', token)
      }
    }
    sessionStorage.removeItem('login:persist')
    window.location.replace('#/home')
  }, [])

  return <div>Processando login...</div>
}

export default GoogleCallback
