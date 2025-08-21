import { apiRequest } from './api'

export interface TempPermissaoInput {
  tela_id: number
  operacoes: Record<string, boolean>
  inicio: string
  fim: string
}

export interface TempPermissao extends TempPermissaoInput {
  id: number
  status: string
}

export function listarPermissoesTemporarias(
  usuarioId: number,
  status: string = 'ativas',
) {
  return apiRequest<TempPermissao[]>(
    `acessos/usuarios/${usuarioId}/temporarias?status=${status}`,
  )
}

export function criarPermissoesTemporarias(
  usuarioId: number,
  perms: TempPermissaoInput | TempPermissaoInput[],
) {
  const body = Array.isArray(perms) ? perms : [perms]
  return apiRequest<TempPermissao[]>(
    `acessos/usuarios/${usuarioId}/temporarias`,
    { method: 'POST', body },
  )
}

export function revogarPermissaoTemporaria(usuarioId: number, permId: number) {
  return apiRequest<TempPermissao>(
    `acessos/usuarios/${usuarioId}/temporarias/${permId}`,
    { method: 'PATCH' },
  )
}
