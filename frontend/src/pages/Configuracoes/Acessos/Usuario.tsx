import React, { useEffect, useState } from 'react'
import {
  listarPermissoesTemporarias,
  criarPermissoesTemporarias,
  revogarPermissaoTemporaria,
  TempPermissao,
  TempPermissaoInput,
} from '@/services/permissoesTemp'
import { apiRequest } from '@/services/api'

const AcessoUsuario: React.FC = () => {
  const [usuarioId, setUsuarioId] = useState<number | ''>('')
  const [telas, setTelas] = useState<any[]>([])
  const [permissoes, setPermissoes] = useState<TempPermissao[]>([])
  const [novaPerm, setNovaPerm] = useState<TempPermissaoInput>({
    tela_id: 0,
    operacoes: { view: true },
    inicio: '',
    fim: '',
  })

  useEffect(() => {
    apiRequest('telas')
      .then((data) => setTelas(data))
      .catch(() => setTelas([]))
  }, [])

  const carregar = async () => {
    if (!usuarioId) return
    const dados = await listarPermissoesTemporarias(Number(usuarioId))
    setPermissoes(dados)
  }

  const adicionar = async () => {
    if (!usuarioId) return
    await criarPermissoesTemporarias(Number(usuarioId), novaPerm)
    setNovaPerm({ ...novaPerm, inicio: '', fim: '' })
    carregar()
    window.dispatchEvent(new Event('permissions:refresh'))
  }

  const revogar = async (id: number) => {
    if (!usuarioId) return
    await revogarPermissaoTemporaria(Number(usuarioId), id)
    carregar()
    window.dispatchEvent(new Event('permissions:refresh'))
  }

  return (
    <section className="home-welcome">
      <h2>Acessos e Permissões - Usuário</h2>
      <div>
        <input
          placeholder="ID do usuário"
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value)}
        />
        <button onClick={carregar}>Buscar</button>
      </div>
      <div>
        <select
          value={novaPerm.tela_id}
          onChange={(e) => setNovaPerm({ ...novaPerm, tela_id: Number(e.target.value) })}
        >
          <option value={0}>Selecione a tela</option>
          {telas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={novaPerm.inicio}
          onChange={(e) => setNovaPerm({ ...novaPerm, inicio: e.target.value })}
        />
        <input
          type="datetime-local"
          value={novaPerm.fim}
          onChange={(e) => setNovaPerm({ ...novaPerm, fim: e.target.value })}
        />
        <button onClick={adicionar}>Adicionar permissão temporária</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Tela</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {permissoes.map((p) => (
            <tr key={p.id}>
              <td>{p.tela_id}</td>
              <td>{p.inicio}</td>
              <td>{p.fim}</td>
              <td>{p.status}</td>
              <td>
                <button onClick={() => revogar(p.id)}>Revogar agora</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default AcessoUsuario
