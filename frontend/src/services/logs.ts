import { authFetch } from './api'


export interface LogConfigPayload {
  tela: string
  crud: string[]
}

export async function cadastrarConfig(data: LogConfigPayload): Promise<void> {
  try {
    const res = await authFetch('/logs/config', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
  } catch (e: any) {
    throw new Error(e?.message || 'Erro ao salvar configuração')
  }
}

