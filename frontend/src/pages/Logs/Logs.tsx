import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE, getAuthToken } from '@/services/api'

import LogsConfig from './LogsConfig'
import LogsOverview from './LogsOverview'
import '../../styles/Logs.css'

type Tab = 'config' | 'overview'

const Logs: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tabParam = searchParams.get('tab') === 'config' ? 'config' : 'overview'
  const screenParam = searchParams.get('screen') || ''
  const [tab, setTab] = useState<Tab>(tabParam)

  useEffect(() => {
    setTab(tabParam)
  }, [tabParam])

  useEffect(() => {
    if (!getAuthToken()) navigate('/login')
  }, [navigate])


  const carregar = () => {
    const params: Record<string, string> = {}
    if (usuario) params.id_usuario = usuario
    if (entidade) params.entidade = entidade
    if (dataInicio) params.data_inicio = dataInicio
    if (dataFim) params.data_fim = dataFim
    const token = getAuthToken()
    axios
      .get<LogItem[]>(`${API_BASE}/logs`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((r) => setLogs(r.data))
      .catch(() => setLogs([]))

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
