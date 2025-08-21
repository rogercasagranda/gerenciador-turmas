import { apiRequest } from './api'

export interface Grupo {
  id: number
  nome: string
}

export interface GrupoPermissao {
  tela_id: number
  operacoes: Record<string, boolean>
}

export function listarGrupos() {
  return apiRequest<Grupo[]>('acessos/grupos')
}

export function listarPermissoesGrupo(grupoId: number) {
  return apiRequest<GrupoPermissao[]>(`acessos/grupos/${grupoId}/permissoes`)
}

export function salvarPermissoesGrupo(grupoId: number, perms: GrupoPermissao[]) {
  return apiRequest<GrupoPermissao[]>(`acessos/grupos/${grupoId}/permissoes`, {
    method: 'POST',
    body: perms,
  })
}
