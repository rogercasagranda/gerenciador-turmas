export function getAuthToken(): string | null {
  const local = localStorage.getItem('authToken')
  if (local) return local
  return sessionStorage.getItem('authToken')
}

export function saveAuthToken(token: string, remember: boolean): void {
  if (remember) {
    localStorage.setItem('authToken', token)
  } else {
    sessionStorage.setItem('authToken', token)
  }
}

export function clearAuth(): void {
  localStorage.removeItem('authToken')
  sessionStorage.removeItem('authToken')
}

interface JwtPayload {
  exp?: number
  [key: string]: any
}

export function parseJwt(token: string): JwtPayload {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch {
    return {}
  }
}

export function isTokenExpired(token: string): boolean {
  const { exp } = parseJwt(token)
  if (!exp) return false
  const now = Math.floor(Date.now() / 1000)
  return exp < now
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  if (token && !isTokenExpired(token)) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}
