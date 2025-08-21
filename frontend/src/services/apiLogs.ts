import { apiFetch } from './api'

export type LogFlags = { create:boolean; read:boolean; update:boolean; delete:boolean }
export type LogConfigOut = LogFlags & { screen:string; updated_at:string; updated_by_name:string }

export async function fetchScreens(): Promise<Array<{key:string; label:string}>> {
  return apiFetch('/logs/config/screens')
}

export async function fetchLogConfig(screen:string): Promise<LogConfigOut> {
  return apiFetch(`/logs/config?screen=${encodeURIComponent(screen)}`)
}

export async function saveLogConfig(body: {screen:string}&LogFlags&{applyAll?:boolean}): Promise<LogConfigOut> {
  return apiFetch('/logs/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export type SummaryRow = {
  screen:string; CREATE:boolean; READ:boolean; UPDATE:boolean; DELETE:boolean;
  updated_by_name:string; updated_at:string
}
export type SummaryResp = { page:number; pageSize:number; total:number; items:SummaryRow[] }

export async function fetchLogsSummary(params: {page?:number; pageSize?:number; screen?:string; action?:'CREATE'|'READ'|'UPDATE'|'DELETE'; onlyActive?:boolean} = {}): Promise<SummaryResp> {
  const urlParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') urlParams.set(k, String(v))
  })
  const qs = urlParams.toString()
  return apiFetch(`/logs/summary${qs ? `?${qs}` : ''}`)
}

