import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useBaseNavigate from '@/hooks/useBaseNavigate'
import { authFetch } from '@/services/api'
import LogsConfig from './LogsConfig'
import LogsOverview from './LogsOverview'
import '../../styles/Logs.css'

type Tab = 'config' | 'overview'
type LogItem = Record<string, any>

const Logs: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useBaseNavigate()
  const tabParam = searchParams.get('tab') === 'config' ? 'config' : 'overview'
  const screenParam = searchParams.get('screen') || ''
  const [tab, setTab] = useState<Tab>(tabParam)

  const [usuario, setUsuario] = useState('')
  const [entidade, setEntidade] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [logs, setLogs] = useState<LogItem[]>([])

  useEffect(() => {
    setTab(tabParam)
  }, [tabParam])

  const carregar = () => {
    const params: Record<string, string> = {}
    if (usuario) params.id_usuario = usuario
    if (entidade) params.entidade = entidade
    if (dataInicio) params.data_inicio = dataInicio
    if (dataFim) params.data_fim = dataFim
    const qs = new URLSearchParams(params).toString()
    authFetch(`/logs${qs ? `?${qs}` : ''}`, { method: 'GET' })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const r: any = await res.json()
        setLogs(r)
      })
      .catch(() => setLogs([]))
  }

  const changeTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    navigate({ search: params.toString() })
  }

  const handleEdit = (screen: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', 'config')
    params.set('screen', screen)
    navigate({ search: params.toString() })
  }

  return (
    <section className="logs-section">
      <div className="logs-tabs">
        <button
          className={`logs-tab ${tab === 'config' ? 'active' : ''}`}
          onClick={() => changeTab('config')}
        >
          Configurar
        </button>
        <button
          className={`logs-tab ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => changeTab('overview')}
        >
          Visão geral
        </button>
      </div>
      <div hidden={tab !== 'config'}>
        <LogsConfig initialScreen={screenParam} />
      </div>
      <div hidden={tab !== 'overview'}>
        <LogsOverview onEdit={handleEdit} />
      </div>
    </section>
  )
}

export default Logs
