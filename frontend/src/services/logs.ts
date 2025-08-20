import { API_BASE, getAuthToken } from './api'

// Tipos de ações permitidas para CRUD
export type CrudAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'

// Estrutura do payload de configuração
export interface LogConfigPayload {
  tela: string
  crud: CrudAction[]
}

// Cabeçalhos padrão das requisições autenticadas
function headers(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Salva configuração de log via POST
export async function saveLogConfig(payload: LogConfigPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/logs/config`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(String(res.status))
}

// Descobre telas locais mapeando arquivos de páginas
export function discoverLocalScreens(): string[] {
  const modules = import.meta.glob('../pages/**/*.tsx')
  return Object.keys(modules).map((p) => p.replace('../pages/', '').replace(/\.tsx$/, ''))
}

// Lista telas disponíveis; usa mapeamento local e faz fallback para API
export async function listScreens(): Promise<string[]> {
  const local = discoverLocalScreens()
  if (local.length) return local.sort()
  try {
    const res = await fetch(`${API_BASE}/logs/telas`, { headers: headers() })
    if (!res.ok) throw new Error(String(res.status))
    return await res.json()
  } catch {
    return []
  }
}

// Converte caminho da tela em rótulo amigável
export function screenLabel(name: string): string {
  const parts = name.split('/')
  return parts
    .map((part, idx) => {
      const prev = idx > 0 ? parts[idx - 1].replace(/s$/i, '') : ''
      let label = part.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ')
      if (idx === parts.length - 1 && prev) {
        label = label.replace(new RegExp(prev, 'i'), '')
      }
      label = label.replace(/\s+/g, ' ').trim()
      const map: Record<string, string> = {
        Usuarios: 'Usuários',
        Usuario: 'Usuário',
      }
      label = map[label] ?? label
      return label.charAt(0).toUpperCase() + label.slice(1)
    })
    .join(' > ')
}
