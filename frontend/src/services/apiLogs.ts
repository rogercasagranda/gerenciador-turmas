import { API_BASE, getAuthToken } from './api'

export type LogFlags = { create:boolean; read:boolean; update:boolean; delete:boolean }
export type LogConfigOut = LogFlags & { screen:string; updated_at:string; updated_by_name:string }

function authHeaders() {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export async function fetchScreens(): Promise<Array<{key:string; label:string}>> {
  const r = await fetch(`${API_BASE}/logs/config/screens`, { headers: authHeaders() })
  if (!r.ok) throw new Error('Falha ao carregar telas')
  return r.json()
}

export async function fetchLogConfig(screen:string): Promise<LogConfigOut> {
  const r = await fetch(`${API_BASE}/logs/config?screen=${encodeURIComponent(screen)}`, { headers: authHeaders() })
  if (!r.ok) throw new Error('Falha ao carregar configuração')
  return r.json()
}

export async function saveLogConfig(body: {screen:string}&LogFlags&{applyAll?:boolean}): Promise<LogConfigOut> {
  const r = await fetch(`${API_BASE}/logs/config`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error('Falha ao salvar configuração')
  return r.json()
}

export type SummaryRow = {
  screen:string; CREATE:boolean; READ:boolean; UPDATE:boolean; DELETE:boolean;
  updated_by_name:string; updated_at:string
}
export type SummaryResp = { page:number; pageSize:number; total:number; items:SummaryRow[] }

export async function fetchLogsSummary(params: {page?:number; pageSize?:number; screen?:string; action?:'CREATE'|'READ'|'UPDATE'|'DELETE'; onlyActive?:boolean} = {}): Promise<SummaryResp> {
  const u = new URL(`${API_BASE}/logs/summary`)
  Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') u.searchParams.set(k, String(v)) })
  const r = await fetch(u.toString(), { headers: authHeaders() })
  if (!r.ok) throw new Error('Falha ao carregar visão geral')
  return r.json()
}

