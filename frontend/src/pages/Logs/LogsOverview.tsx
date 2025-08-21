import React, { useEffect, useMemo, useState } from 'react'
import { fetchScreens, fetchLogsSummary, SummaryRow } from '@/services/apiLogs'
import '../../styles/Logs.css'

interface Props {
  onEdit: (screen: string) => void
}

const LogsOverview: React.FC<Props> = ({ onEdit }) => {
  const [screens, setScreens] = useState<Array<{ key: string; label: string }>>([])
  const [screen, setScreen] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [items, setItems] = useState<SummaryRow[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchScreens()
      .then(setScreens)
      .catch(() => setScreens([]))
  }, [])

  useEffect(() => {
    fetchLogsSummary({
      page,
      pageSize,
      screen: screen || undefined,
      action: action || undefined,
      onlyActive,
    })
      .then((r) => {
        setItems(r.items)
        setTotal(r.total)
      })
      .catch(() => {
        setItems([])
        setTotal(0)
      })
  }, [page, pageSize, screen, action, onlyActive])

  const filtrados = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.screen.toLowerCase().includes(q) ||
        i.updated_by_name.toLowerCase().includes(q)
    )
  }, [items, search])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const exportarCsv = () => {
    const header = 'Tela,CREATE,READ,UPDATE,DELETE,Alterado por,Última alteração\n'
    const corpo = filtrados
      .map((i) =>
        [
          i.screen,
          i.CREATE ? 'SIM' : 'NAO',
          i.READ ? 'SIM' : 'NAO',
          i.UPDATE ? 'SIM' : 'NAO',
          i.DELETE ? 'SIM' : 'NAO',
          i.updated_by_name,
          i.updated_at ? new Date(i.updated_at).toISOString() : '',
        ]
          .map((v) => `"${v}"`)
          .join(',')
      )
      .join('\n')
    const blob = new Blob([header + corpo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'logs.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="logs-wrapper">
      <h2>Visão geral de Logs</h2>
      <div className="filtros">
        <div>
          <input
            list="telas"
            placeholder="Tela"
            value={screen}
            onChange={(e) => {
              setScreen(e.target.value)
              setPage(1)
            }}
          />
          <datalist id="telas">
            {screens.map((s) => (
              <option key={s.key} value={s.key} label={s.label} />
            ))}
          </datalist>
        </div>
        <label>
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => {
              setOnlyActive(e.target.checked)
              setPage(1)
            }}
          />
          Somente ativos
        </label>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todas as ações</option>
          <option value="CREATE">CREATE</option>
          <option value="READ">READ</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          type="text"
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <table className="tabela">
        <thead>
          <tr>
            <th>Tela</th>
            <th>CREATE</th>
            <th>READ</th>
            <th>UPDATE</th>
            <th>DELETE</th>
            <th>Alterado por</th>
            <th>Última alteração</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 && (
            <tr>
              <td colSpan={8}>Nenhum registro</td>
            </tr>
          )}
          {filtrados.map((i) => (
            <tr key={i.screen}>
              <td>{i.screen}</td>
              <td>{i.CREATE ? '✔' : ''}</td>
              <td>{i.READ ? '✔' : ''}</td>
              <td>{i.UPDATE ? '✔' : ''}</td>
              <td>{i.DELETE ? '✔' : ''}</td>
              <td>{i.updated_by_name}</td>
              <td>
                {i.updated_at ? new Date(i.updated_at).toLocaleString() : '—'}
              </td>
              <td>
                <button className="button" onClick={() => onEdit(i.screen)}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="paginacao">
        <button className="button" onClick={exportarCsv}>
          Exportar CSV
        </button>
        <button
          className="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          className="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Próxima
        </button>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
            setPage(1)
          }}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default LogsOverview
