// Serviço para operações de feriados
import { API_BASE, getAuthToken } from './api'

// Tipo de feriado utilizado na aplicação
export interface Feriado {
  id?: number
  ano_letivo_id?: number
  data: string
  descricao: string
  origem: 'ESCOLA' | 'NACIONAL'
}

function headers(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Busca feriados nacionais por ano
export async function getNacionais(ano: number): Promise<Feriado[]> {
  const res = await fetch(`${API_BASE}/feriados/nacionais?ano=${ano}`, { headers: headers() })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Busca feriados associados a um ano letivo
export async function getByAnoLetivo(id: number): Promise<Feriado[]> {
  const res = await fetch(`${API_BASE}/feriados?anoLetivoId=${id}`, { headers: headers() })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Cria um feriado manual
export async function create(data: { ano_letivo_id: number; data: string; descricao: string; origem: 'ESCOLA' | 'NACIONAL' }): Promise<Feriado> {
  const res = await fetch(`${API_BASE}/feriados`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Atualiza feriado existente
export async function update(id: number, data: { data?: string; descricao?: string; origem?: 'ESCOLA' | 'NACIONAL' }): Promise<Feriado> {
  const res = await fetch(`${API_BASE}/feriados/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Remove feriado
export async function remove(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/feriados/${id}`, { method: 'DELETE', headers: headers() })
  if (!res.ok) throw new Error(String(res.status))
}

// Importa todos os feriados nacionais
export async function importarNacionais(payload: { ano_letivo_id: number; ano: number }): Promise<void> {
  const res = await fetch(`${API_BASE}/feriados/importar-nacionais`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(String(res.status))
}
