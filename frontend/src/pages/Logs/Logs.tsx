import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

  const changeTab = (t: Tab) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', t)
    if (t !== 'config') params.delete('screen')
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
