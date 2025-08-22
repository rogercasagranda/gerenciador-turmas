import { getAuthHeaders, clearAuth } from './auth'

const API_URL = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '')

async function request(path: string, options: RequestInit = {}) {
  const headers = { ...options.headers, ...getAuthHeaders() } as Record<string, string>
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (res.status === 401) {
    clearAuth()
    const evt = new Event('auth:unauthorized')
    window.dispatchEvent(evt)
    setTimeout(() => {
      window.location.href = '/login'
    }, 5000)
  }
  return res
}

export async function get(path: string, options: RequestInit = {}) {
  return request(path, { ...options, method: 'GET' })
}

export async function post(path: string, body: any, options: RequestInit = {}) {
  return request(path, { ...options, method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
}

export async function put(path: string, body: any, options: RequestInit = {}) {
  return request(path, { ...options, method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
}

export async function del(path: string, options: RequestInit = {}) {
  return request(path, { ...options, method: 'DELETE' })
}
