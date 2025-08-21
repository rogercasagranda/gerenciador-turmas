import { apiFetch } from './api'


export interface LogConfigPayload {
  tela: string
  crud: string[]
}

export async function cadastrarConfig(data: LogConfigPayload): Promise<void> {
  try {
    await apiFetch('/logs/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch (e: any) {
    throw new Error(e?.message || 'Erro ao salvar configuração')
  }
}

