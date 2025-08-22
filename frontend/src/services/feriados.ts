// Serviço para operações de feriados
import { API_BASE, authFetch } from './api'

// Tipo de feriado utilizado na aplicação
export interface Feriado {
  id?: number
  ano_letivo_id?: number
  data: string
  descricao: string
  origem: 'ESCOLA' | 'NACIONAL'
}

// Busca feriados associados a um ano letivo
export async function getFeriados(anoLetivoId: number): Promise<Feriado[]> {
  const res = await authFetch(`${API_BASE}/feriados?anoLetivoId=${anoLetivoId}`)
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Cria um novo feriado
export async function createFeriado(dto: { ano_letivo_id: number; data: string; descricao: string; origem: 'ESCOLA' }): Promise<Feriado> {
  const res = await authFetch(`${API_BASE}/feriados`, {
    method: 'POST',
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Atualiza feriado existente
export async function updateFeriado(id: number, dto: { data?: string; descricao?: string }): Promise<Feriado> {
  const res = await authFetch(`${API_BASE}/feriados/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Remove feriado
export async function deleteFeriado(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/feriados/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(String(res.status))
}

// Importa feriados nacionais
export async function importarNacionais(payload: { ano_letivo_id: number; anos: number[] }): Promise<void> {
  const res = await authFetch(`${API_BASE}/feriados/importar-nacionais`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(String(res.status))
}

// Opcional: obtém feriados nacionais de um ano específico
export async function getNacionaisStub(ano: number): Promise<Feriado[]> {
  const res = await authFetch(`${API_BASE}/feriados/nacionais?ano=${ano}`)
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Backwards compatibility exports (caso outros módulos ainda importem)
export { getFeriados as getByAnoLetivo, createFeriado as create, updateFeriado as update, deleteFeriado as remove }
