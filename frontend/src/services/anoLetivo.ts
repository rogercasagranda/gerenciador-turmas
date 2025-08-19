// Serviço para operações com anos letivos
import { API_BASE } from './api'
import { getAuthToken } from './api'

// Tipo de ano letivo retornado pela API
export interface AnoLetivo {
  id: number
  ano: number
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

// Tipo de período do ano letivo
export interface Periodo {
  id: number // identificador do período
  data_inicio: string // data de início no formato ISO
  data_fim: string // data de término no formato ISO
}

// Cria um novo ano letivo
export async function createAnoLetivo(dto: { ano: number; ativo: boolean }): Promise<AnoLetivo> {
  const res = await fetch(`${API_BASE}/ano-letivo`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Atualiza um ano letivo existente
export async function updateAnoLetivo(id: number, dto: { ano: number; ativo: boolean }): Promise<AnoLetivo> {
  const res = await fetch(`${API_BASE}/ano-letivo/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Remove um ano letivo
export async function deleteAnoLetivo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/ano-letivo/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error(String(res.status))
}

// Lista períodos vinculados a um ano letivo
export async function getPeriodos(anoLetivoId: number): Promise<Periodo[]> {
  const res = await fetch(`${API_BASE}/ano-letivo/${anoLetivoId}/periodos`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Cria um período
export async function createPeriodo(anoLetivoId: number, dto: { data_inicio: string; data_fim: string }): Promise<Periodo> {
  const res = await fetch(`${API_BASE}/ano-letivo/${anoLetivoId}/periodos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Atualiza um período existente
export async function updatePeriodo(id: number, dto: { data_inicio: string; data_fim: string }): Promise<Periodo> {
  const res = await fetch(`${API_BASE}/periodos/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Remove um período
export async function deletePeriodo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/periodos/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error(String(res.status))
}
