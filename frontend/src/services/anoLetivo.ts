// Serviço para operações com anos letivos
import { API_BASE } from './api'
import { getAuthToken } from './api'

// Tipo de ano letivo retornado pela API
export interface AnoLetivo {
  id: number
  ano: number
  data_inicio: string
  data_fim: string
  ativo?: boolean
}

// Cabeçalhos padrão com token
function headers(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Lista todos os anos letivos
export async function getAnoLetivos(): Promise<AnoLetivo[]> {
  const res = await fetch(`${API_BASE}/ano-letivo`, { headers: headers() })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}
