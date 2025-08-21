import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE } from '@/services/api'
import '../../styles/Logs.css'
import useDirtyForm from '@/hooks/useDirtyForm'

type LogItem = {
  id_log: number
  id_usuario: number
  acao: string
  entidade: string
  descricao?: string | null
  data_evento: string
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [usuario, setUsuario] = useState('')
  const [entidade, setEntidade] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const { setDirty } = useDirtyForm()

  const carregar = () => {
    const params: Record<string, string> = {}
    if (usuario) params.id_usuario = usuario
    if (entidade) params.entidade = entidade
    if (dataInicio) params.data_inicio = dataInicio
    if (dataFim) params.data_fim = dataFim
    const token =
      localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    axios
      .get<LogItem[]>(`${API_BASE}/logs`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((r) => setLogs(r.data))
      .catch(() => setLogs([]))
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <div className="logs-wrapper">
      <h2>Logs de Auditoria</h2>
      <div className="filtros">
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => {
            setDataInicio(e.target.value)
            setDirty(true)
          }}
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => {
            setDataFim(e.target.value)
            setDirty(true)
          }}
        />
        <input
          type="text"
          placeholder="ID Usuário"
          value={usuario}
          onChange={(e) => {
            setUsuario(e.target.value)
            setDirty(true)
          }}
        />
        <input
          type="text"
          placeholder="Tela"
          value={entidade}
          onChange={(e) => {
            setEntidade(e.target.value)
            setDirty(true)
          }}
        />
        <button
          className="button"
          onClick={() => {
            carregar()
            setDirty(false)
          }}
        >
          Filtrar
        </button>
      </div>
      <table className="tabela">
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Tela</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={5}>Nenhum log encontrado</td>
            </tr>
          )}
          {logs.map((l) => (
            <tr key={l.id_log}>
              <td>{new Date(l.data_evento).toLocaleString()}</td>
              <td>{l.id_usuario}</td>
              <td>{l.acao}</td>
              <td>{l.entidade}</td>
              <td>{l.descricao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Logs
