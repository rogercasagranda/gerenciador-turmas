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
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const token =
    localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

  const carregar = () => {
    axios
      .get<ConfigItem[]>(`${API_BASE}/logs/config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((r) => setConfigs(r.data))
      .catch(() => setConfigs([]))
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
        <button onClick={() => atualizarTodos(true)}>Ativar todos</button>
        <button onClick={() => atualizarTodos(false)}>Desativar todos</button>
      </div>
      <table className="tabela">
        <thead>
          <tr>
            <th>Tela</th>
            <th>Habilitado</th>
          </tr>
        </thead>
        <tbody>
          {configs
            .filter((c) => c.entidade !== '__all__')
            .map((cfg) => (
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
