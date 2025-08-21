import React, { useEffect, useState } from 'react'
import { listarGrupos, Grupo } from '@/services/permissoesGrupo'
import {
  listarUsuariosPorGrupo,
  exportarUsuariosPorGrupo,
  UsuarioGrupoItem,
} from '@/services/usuariosPorGrupo'

const ConsultarAcessos: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [selecionados, setSelecionados] = useState<number[]>([])
  const [perfil, setPerfil] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [dados, setDados] = useState<UsuarioGrupoItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  useEffect(() => {
    listarGrupos()
      .then(setGrupos)
      .catch(() => setGrupos([]))
  }, [])

  useEffect(() => {
    carregar()
  }, [selecionados, perfil, status, q, page])

  async function carregar() {
    const resp = await listarUsuariosPorGrupo({
      groupIds: selecionados,
      perfil: perfil || undefined,
      status: status || undefined,
      q: q || undefined,
      page,
      limit,
    })
    setDados(resp.items)
    setTotal(resp.total)
  }

  function toggleGrupo(id: number) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  }

  async function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    const blob = await exportarUsuariosPorGrupo(
      {
        groupIds: selecionados,
        perfil: perfil || undefined,
        status: status || undefined,
        q: q || undefined,
      },
      format,
    )
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usuarios_por_grupo.${format}`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <section className="home-welcome">
      <h2>Acessos e Permissões - Usuários por Grupo</h2>
      <div>
        <label>Grupos:</label>
        {grupos.map((g) => (
          <label key={g.id} style={{ marginRight: '8px' }}>
            <input
              type="checkbox"
              value={g.id}
              checked={selecionados.includes(g.id)}
              onChange={() => toggleGrupo(g.id)}
            />
            {g.nome}
          </label>
        ))}
      </div>
      <div>
        <label>Perfil:</label>
        <input
          value={perfil}
          placeholder="Perfil"
          onChange={(e) => setPerfil(e.target.value)}
        />
        <label>Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
        <input
          value={q}
          placeholder="Buscar"
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={() => {
            setPage(1)
            carregar()
          }}
        >
          Filtrar
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
            <th>Grupos</th>
            <th>Último acesso</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((u) => (
            <tr key={u.id_usuario}>
              <td>{u.nome}</td>
              <td>{u.email}</td>
              <td>{u.perfil}</td>
              <td>{u.grupos.join(', ')}</td>
              <td>
                {u.ultimo_acesso
                  ? new Date(u.ultimo_acesso).toLocaleString()
                  : ''}
              </td>
              <td>{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Anterior
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Próxima
        </button>
      </div>
      <div>
        <button onClick={() => handleExport('csv')}>CSV</button>
        <button onClick={() => handleExport('xlsx')}>XLSX</button>
        <button onClick={() => handleExport('pdf')}>PDF</button>
      </div>
    </section>
  )
}

export default ConsultarAcessos
