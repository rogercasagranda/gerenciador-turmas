import { API_BASE, getAuthToken } from './api'


export interface LogConfigPayload {
  tela: string
  crud: string[]
}

export async function cadastrarConfig(data: LogConfigPayload): Promise<void> {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE}/logs/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    let msg = 'Erro ao salvar configuração'
    try {
      const payload = await res.json()
      msg = payload?.detail || msg
    } catch {}
    throw new Error(msg)
  }
}

