// Serviço de acesso à API de Ano Letivo usando apenas
// os campos { descricao, data_inicio, data_fim }
// Cada função faz a chamada HTTP correspondente e lança
// erro contendo o status em caso de falha.

import { API_BASE, getAuthToken } from './api'

// Estrutura do ano letivo conforme API
export interface AnoLetivo {
  id: number
  descricao: string
  data_inicio: string
  data_fim: string
}

// Monta cabeçalho padrão com token de autenticação
function buildHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Lista todos os anos letivos
export async function getAnoLetivos(): Promise<AnoLetivo[]> {
  const res = await fetch(`${API_BASE}/ano-letivo`, {
    headers: buildHeaders(),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Obtém um ano letivo específico
export async function getAnoLetivo(id: number): Promise<AnoLetivo> {
  const res = await fetch(`${API_BASE}/ano-letivo/${id}`, {
    headers: buildHeaders(),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Cria um novo ano letivo
export async function createAnoLetivo(dto: Omit<AnoLetivo, 'id'>): Promise<AnoLetivo> {
  const res = await fetch(`${API_BASE}/ano-letivo`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Atualiza um ano letivo existente
export async function updateAnoLetivo(id: number, dto: Omit<AnoLetivo, 'id'>): Promise<AnoLetivo> {
  const res = await fetch(`${API_BASE}/ano-letivo/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

// Remove um ano letivo
export async function deleteAnoLetivo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/ano-letivo/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  if (!res.ok) throw new Error(String(res.status))
}

