import { API_BASE, getAuthToken } from './api'

// Estrutura do payload de configuração de logs
export interface LogConfigPayload {
  tela: string
  crud: string[]
}

// Monta cabeçalhos padrão incluindo token quando disponível
function buildHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Processa resposta lançando erro com mensagem do backend quando possível
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let payload: any = {}
    try { payload = await res.json() } catch {}
    throw new Error(payload?.detail || 'Erro na API')
  }
  return res.json() as Promise<T>
}

// Lista telas configuradas para logs; retorna null se endpoint não existir (404)
export async function listarTelas(): Promise<string[] | null> {
  const res = await fetch(`${API_BASE}/logs/telas`, { headers: buildHeaders() })
  if (res.status === 404) return null
  return handle<string[]>(res)
}

// Cadastra configuração de logs para uma tela específica
export async function cadastrarConfig(payload: LogConfigPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/logs/config`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let msg = 'Erro na API'
    try { msg = (await res.json())?.detail || msg } catch {}
    throw new Error(msg)
  }
}

// Exclui logs dentro de um período informado (opcional)
export async function excluirPorPeriodo(from: string, to: string): Promise<void> {
  const url = `${API_BASE}/logs?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  if (!res.ok) {
    let msg = 'Erro na API'
    try { msg = (await res.json())?.detail || msg } catch {}
    throw new Error(msg)
  }
}

