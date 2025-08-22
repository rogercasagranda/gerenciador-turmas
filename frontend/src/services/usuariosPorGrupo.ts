import { apiRequest, authFetch } from './api'

export interface UsuarioGrupoItem {
  id_usuario: number
  nome: string
  email: string
  perfil: string | null
  grupos: string[]
  ultimo_acesso: string | null
  status: string
}

export interface UsuariosPorGrupoResponse {
  items: UsuarioGrupoItem[]
  total: number
  page: number
  limit: number
}

function buildParams(params: Record<string, any>): string {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return
    if (Array.isArray(v)) sp.set(k, v.join(','))
    else sp.set(k, String(v))
  })
  return sp.toString()
}

export function listarUsuariosPorGrupo(params: {
  groupIds?: number[]
  perfil?: string
  status?: string
  q?: string
  page?: number
  limit?: number
}) {
  const query = buildParams({
    group_ids: params.groupIds,
    perfil: params.perfil,
    status: params.status,
    q: params.q,
    page: params.page ?? 1,
    limit: params.limit ?? 50,
  })
  return apiRequest<UsuariosPorGrupoResponse>(`acessos/usuarios-por-grupo?${query}`)
}

export async function exportarUsuariosPorGrupo(
  params: {
    groupIds?: number[]
    perfil?: string
    status?: string
    q?: string
  },
  format: 'csv' | 'xlsx' | 'pdf',
) {
  const query = buildParams({
    group_ids: params.groupIds,
    perfil: params.perfil,
    status: params.status,
    q: params.q,
    format,
  })
  const res = await authFetch(
    `/acessos/export/usuarios-por-grupo?${query}`,
  )
  if (!res.ok) throw new Error('Falha na exportação')
  return res.blob()
}
