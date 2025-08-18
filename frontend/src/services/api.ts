// frontend/src/services/api.ts
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
}

export async function deleteUsuario(id: number): Promise<{ message: string }>{ 
  const token = getAuthToken()
  const res = await fetch(`${API_BASE}/usuarios/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    let payload: any = {}
    try { payload = await res.json() } catch {}
    throw new Error(payload?.detail || 'Falha ao excluir usuário')
  }
  return res.json()
}
