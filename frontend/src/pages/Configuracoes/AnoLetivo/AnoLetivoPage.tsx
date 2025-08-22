import React, { useEffect, useState } from 'react'
import useBaseNavigate from '@/hooks/useBaseNavigate'
import ListPage from '../../../components/ListPage'
import '../../../styles/CadastrarUsuario.css'

import { AnoLetivo, getAnoLetivos } from '../../../services/anoLetivo'
import { apiFetch, getAuthToken } from '../../../services/api'
import { safeAlert } from '@/utils/safeAlert'

const PERFIS_PERMITIDOS = new Set(['master', 'diretor'])

const toCanonical = (perfil: string) => {
  const p = (perfil || '').toLowerCase()
  if (p.startsWith('diretor')) return 'diretor'
  if (p.startsWith('coordenador')) return 'coordenador'
  if (p.startsWith('professor')) return 'professor'
  if (p === 'aluno' || p === 'aluna') return 'aluno'
  return p
}

const formatar = (data: string) => new Date(data).toLocaleDateString('pt-BR')

const AnoLetivoPage: React.FC = () => {
  const [anos, setAnos] = useState<AnoLetivo[]>([])
  const [carregado, setCarregado] = useState(false)
  const [podeGerenciar, setPodeGerenciar] = useState(false)
  const navigate = useBaseNavigate()

  useEffect(() => {
    const token = getAuthToken()
    if (!token) { navigate('/login'); return }
    const carregar = async () => {
      try {
        const me = await apiFetch('/usuarios/me')
        const perfil = toCanonical(me.tipo_perfil || '')
        const autorizado = me.is_master || PERFIS_PERMITIDOS.has(perfil)
        if (!autorizado) { safeAlert('ACESSO NEGADO'); return }
        setPodeGerenciar(Boolean(autorizado))
        try { await apiFetch('/usuarios/log-perfil') } catch {}
        const lista = await getAnoLetivos()
        setAnos(lista)
      } catch (e: any) {
        if (e?.status === 401) { navigate('/login'); return }
        if (e?.status === 403) { safeAlert('ACESSO NEGADO'); return }
        setAnos([])
      } finally {
        setCarregado(true)
      }
    }
    carregar()
  }, [navigate])

  const novo = podeGerenciar ? (
    <button className="btn primario button">Novo</button>
  ) : null

  return (
    <ListPage title="Anos Letivos" actions={novo}>
      {!carregado && <p className="carregando">Carregando...</p>}
      {carregado && anos.length === 0 && <p>Nenhum ano letivo cadastrado.</p>}
      {anos.length > 0 && (
        <table className="holiday-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {anos.map(a => (
              <tr key={a.id}>
                <td>{a.descricao}</td>
                <td>{formatar(a.data_inicio)}</td>
                <td>{formatar(a.data_fim)}</td>
                <td>
                  {podeGerenciar && (
                    <>
                      <button className="btn secundario" onClick={() => {}}>
                        Editar
                      </button>
                      <button className="btn perigo" onClick={() => {}}>
                        Excluir
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ListPage>
  )
}

export default AnoLetivoPage
