import React, { useEffect, useState } from 'react'
import axios from 'axios'
import '../../styles/Logs.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type ConfigItem = {
  entidade: string
  habilitado: boolean
}

const LogsConfig: React.FC = () => {
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [globalEnabled, setGlobalEnabled] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [novaEntidade, setNovaEntidade] = useState('')
  const [novaHabilitado, setNovaHabilitado] = useState(true)

  const token =
    localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

  const carregar = () => {
    Promise.all([
      axios.get<ConfigItem[]>(`${API_BASE}/logs/config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
      axios.get<string[]>(`${API_BASE}/logs/entidades`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    ])
      .then(([configRes, telasRes]) => {
        const cfgMap = new Map(
          configRes.data.map((c) => [c.entidade, c.habilitado])
        )
        const todas = Array.from(
          new Set([
            ...telasRes.data,
            ...configRes.data.map((c) => c.entidade),
          ])
        )
        const global = cfgMap.get('__all__')
        setGlobalEnabled(global ?? true)
        setConfigs(
          todas
            .filter((t) => t !== '__all__')
            .map((t) => ({ entidade: t, habilitado: cfgMap.get(t) ?? true }))
        )
      })
      .catch(() => {
        setConfigs([])
        setGlobalEnabled(true)
      })
  }

  useEffect(() => {
    carregar()
  }, [])

  const atualizar = (entidade: string, habilitado: boolean) => {
    axios
      .put(
        `${API_BASE}/logs/config/${encodeURIComponent(entidade)}`,
        { habilitado },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      )
      .then(() => carregar())
      .catch(() => {})
  }

  const atualizarTodos = (habilitado: boolean) => {
    axios
      .put(
        `${API_BASE}/logs/config/all`,
        { habilitado },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      )
      .then(() => carregar())
      .catch(() => {})
  }

  const excluirLogs = () => {
    axios
      .delete(`${API_BASE}/logs`, {
        params: {
          ...(dataInicio ? { data_inicio: dataInicio } : {}),
          ...(dataFim ? { data_fim: dataFim } : {}),
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then(() => alert('Logs excluídos com sucesso'))
      .catch(() => alert('Erro ao excluir logs'))
  }

  return (
    <div className="logs-wrapper">
      <h2>Configuração de Logs</h2>
      <div className="filtros">
        <label>
          Log global
          <input
            type="checkbox"
            checked={globalEnabled}
            onChange={(e) => atualizarTodos(e.target.checked)}
          />
        </label>
      </div>
      <table className="tabela">
        <thead>
          <tr>
            <th>Tela</th>
            <th>Habilitado</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((cfg) => (
            <tr key={cfg.entidade}>
              <td>{cfg.entidade}</td>
              <td>
                <input
                  type="checkbox"
                  checked={cfg.habilitado}
                  onChange={(e) => atualizar(cfg.entidade, e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="filtros">
        <input
          type="text"
          placeholder="Nova tela"
          value={novaEntidade}
          onChange={(e) => setNovaEntidade(e.target.value)}
        />
        <label>
          Habilitado
          <input
            type="checkbox"
            checked={novaHabilitado}
            onChange={(e) => setNovaHabilitado(e.target.checked)}
          />
        </label>
        <button
          onClick={() => {
            const nome = novaEntidade.trim()
            if (nome) {
              atualizar(nome, novaHabilitado)
              setNovaEntidade('')
              setNovaHabilitado(true)
            }
          }}
        >
          Cadastrar
        </button>
      </div>
      <div className="filtros">
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />
        <button onClick={excluirLogs}>Excluir por período</button>
      </div>
    </div>
  )
}

export default LogsConfig
