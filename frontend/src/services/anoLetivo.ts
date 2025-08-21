// Serviço de integração com API de Ano Letivo
// Utiliza API_BASE definido em VITE_API_URL e token Bearer quando disponível

import { API_BASE, getAuthToken } from './api'

// Estrutura básica de Ano Letivo conforme backend
export interface AnoLetivo {
  id: number
  descricao: string
  data_inicio: string
  data_fim: string
}

// Monta cabeçalho padrão com JSON e Authorization quando houver token
function buildHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Trata resposta do backend retornando JSON em sucesso ou erro amigável
async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    try {
      return (await res.json()) as T
    } catch {
      return undefined as T
    }
  }

  let message = `Erro HTTP ${res.status}`
  try {
    const payload = await res.json()
    message = payload?.detail || payload?.message || message
  } catch {}
  throw new Error(message)
}

// Lista anos letivos
export async function listAnoLetivo(): Promise<AnoLetivo[]> {
  const res = await fetch(`${API_BASE}/ano-letivo`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse<AnoLetivo[]>(res)
}

// Cria ano letivo
export async function createAnoLetivo(
  body: Omit<AnoLetivo, 'id'>
): Promise<AnoLetivo> {
  const res = await fetch(`${API_BASE}/ano-letivo`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<AnoLetivo>(res)
}

// Atualiza ano letivo
export async function updateAnoLetivo(
  id: number,
  body: Omit<AnoLetivo, 'id'>
): Promise<AnoLetivo> {
  const res = await fetch(`${API_BASE}/ano-letivo/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<AnoLetivo>(res)
}

// Remove ano letivo
export async function deleteAnoLetivo(id: number): Promise<unknown> {
  const res = await fetch(`${API_BASE}/ano-letivo/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

// Backwards compatibility: export antigo nome utilizado em partes do app
export { listAnoLetivo as getAnoLetivos }

