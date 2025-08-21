import React, { useEffect, useState } from 'react'
import {
  listarGrupos,
  listarPermissoesGrupo,
  salvarPermissoesGrupo,
  Grupo,
  GrupoPermissao,
} from '@/services/permissoesGrupo'
import { apiRequest } from '@/services/api'

const OPERACOES = ['view', 'create', 'update', 'delete', 'export']

const AcessoGrupo: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoId, setGrupoId] = useState<number | ''>('')
  const [telas, setTelas] = useState<any[]>([])
  const [permissoes, setPermissoes] = useState<GrupoPermissao[]>([])
  const [novaPerm, setNovaPerm] = useState<GrupoPermissao>({
    tela_id: 0,
    operacoes: {},
  })

  useEffect(() => {
    listarGrupos()
      .then((gs) => setGrupos(gs.filter((g) => g.nome !== 'Master')))
      .catch(() => setGrupos([]))
    apiRequest('telas')
      .then((data) => setTelas(data))
      .catch(() => setTelas([]))
  }, [])

  useEffect(() => {
    if (grupoId) {
      listarPermissoesGrupo(Number(grupoId))
        .then((p) => setPermissoes(p))
        .catch(() => setPermissoes([]))
    } else {
      setPermissoes([])
    }
  }, [grupoId])

  const togglePermOperacao = (index: number, op: string) => {
    const novo = [...permissoes]
    const perm = { ...novo[index] }
    perm.operacoes = { ...perm.operacoes, [op]: !perm.operacoes[op] }
    novo[index] = perm
    setPermissoes(novo)
  }

  const removerPermissao = (index: number) => {
    setPermissoes(permissoes.filter((_, i) => i !== index))
  }

  const adicionarPermissao = () => {
    if (!novaPerm.tela_id) return
    setPermissoes([...permissoes, novaPerm])
    setNovaPerm({ tela_id: 0, operacoes: {} })
  }

  const salvar = async () => {
    if (!grupoId) return
    await salvarPermissoesGrupo(Number(grupoId), permissoes)
    window.dispatchEvent(new Event('permissions:refresh'))
  }

  return (
    <section className="home-welcome">
      <h2>Acessos e Permissões - Grupo</h2>
      <p>Usuários do grupo herdam todas as permissões do grupo</p>
      <div>
        <select
          value={grupoId}
          onChange={(e) =>
            setGrupoId(e.target.value ? Number(e.target.value) : '')
          }
        >
          <option value="">Selecione o grupo</option>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </div>

      {grupoId && (
        <>
          <table>
            <thead>
              <tr>
                <th>Tela</th>
                {OPERACOES.map((op) => (
                  <th key={op}>{op}</th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {permissoes.map((p, idx) => (
                <tr key={p.tela_id}>
                  <td>{telas.find((t) => t.id === p.tela_id)?.name || p.tela_id}</td>
                  {OPERACOES.map((op) => (
                    <td key={op}>
                      <input
                        type="checkbox"
                        checked={!!p.operacoes[op]}
                        onChange={() => togglePermOperacao(idx, op)}
                      />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => removerPermissao(idx)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <select
              value={novaPerm.tela_id}
              onChange={(e) =>
                setNovaPerm({ ...novaPerm, tela_id: Number(e.target.value) })
              }
            >
              <option value={0}>Selecione a tela</option>
              {telas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {OPERACOES.map((op) => (
              <label key={op}>
                <input
                  type="checkbox"
                  checked={!!novaPerm.operacoes[op]}
                  onChange={(e) =>
                    setNovaPerm({
                      ...novaPerm,
                      operacoes: {
                        ...novaPerm.operacoes,
                        [op]: e.target.checked,
                      },
                    })
                  }
                />
                {op}
              </label>
            ))}
            <button onClick={adicionarPermissao}>
              Adicionar permissão de tela ao grupo
            </button>
          </div>
          <button onClick={salvar}>Salvar</button>
        </>
      )}
    </section>
  )
}

export default AcessoGrupo
