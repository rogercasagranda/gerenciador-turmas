import '../../styles/ConsultarUsuario.lock.css'
import '../../styles/ConsultarUsuario.css'
// Importa React e hooks
import React, { useEffect, useMemo, useState } from 'react'
// Importa HTTP client
import axios from 'axios'
// Importa navegação
import { useNavigate } from 'react-router-dom'
import { API_BASE, getAuthToken } from '@/services/api'

// Define tipo do usuário retornado pela API
type Usuario = {
  id_usuario: number
  nome: string
  email: string
  tipo_perfil?: string | null
  ddi?: string | null
  ddd?: string | null
  numero_celular?: string | null
  is_master?: boolean | null
}

// Define tipo do próprio perfil (resposta de /usuarios/me)
type MeuPerfil = {
  tipo_perfil?: string
  is_master?: boolean
}

// Define perfis com permissão para consultar/editar
const PERFIS_PERMITIDOS = new Set(['master', 'diretor', 'secretaria'])

// Normaliza variações de perfil para a forma canônica
const toCanonical = (perfil: string) => {
  const p = (perfil || '').toLowerCase()
  if (p.startsWith('diretor')) return 'diretor'
  if (p.startsWith('coordenador')) return 'coordenador'
  if (p.startsWith('professor')) return 'professor'
  if (p === 'aluno' || p === 'aluna') return 'aluno'
  return p
}

// Componente principal
const ConsultarUsuario: React.FC = () => {
  // Estados de dados
  const [lista, setLista] = useState<Usuario[]>([])
  const [filtro, setFiltro] = useState<string>('')
  const [carregando, setCarregando] = useState<boolean>(false)
  const [erro, setErro] = useState<string>('')

  // Navegação
  const navigate = useNavigate()


  // Função utilitária: monta headers de autenticação
  const authHeaders = () => {
    const token = getAuthToken()
    if (!token) {
      navigate('/login')
      return null
    }
    return { Authorization: `Bearer ${token}` }
  }

  // Guarda de rota por perfil + carga inicial
  useEffect(() => {
  const carregar = async () => {
    try {
      const headers = authHeaders()
      if (!headers) return

      // Valida perfil (tolerante a 422/500; só 401 derruba sessão)
      try {
        const m = await axios.get<MeuPerfil>(`${API_BASE}/usuarios/me`, { headers })
        const p = toCanonical(m.data.tipo_perfil || '')
        const autorizado = m.data.is_master || PERFIS_PERMITIDOS.has(p)
        if (!autorizado) { navigate('/home'); return }
      } catch (e:any) {
        if (e?.response?.status === 401) { navigate('/login'); return }
      }

      setCarregando(true)
      const r = await axios.get<Usuario[]>(`${API_BASE}/usuarios`, { headers })
      setLista(r.data || [])
      setErro('')
    } catch (e: any) {
      if (e?.response?.status === 401) {
        navigate('/login')
      } else {
        setErro('Falha ao carregar usuários.')
      }
    } finally {
      setCarregando(false)
    }
  }
  carregar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [API_BASE])

  // Lista filtrada (nome, email ou perfil)
  const filtrada = useMemo(() => {
    const term = filtro.trim().toLowerCase()
    if (!term) return lista
    return lista.filter((u) => {
      const nome = (u.nome || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const perfil = (u.tipo_perfil || '').toLowerCase()
      return (
        nome.includes(term) || email.includes(term) || perfil.includes(term)
      )
    })
  }, [filtro, lista])

  // Ação: ir para editar
  const editar = (id: number) => {
    navigate(`/usuarios/cadastrar?id=${id}`)
  }

  // Renderização
  return (
    <div className="consulta-wrapper">
      {/* Cabeçalho da página */}
      <div className="consulta-topo">
        <h2 className="consulta-titulo">Consultar Usuários</h2>
        <div className="consulta-acoes">
          <button
            className="button"
            onClick={() => navigate('/usuarios/cadastrar')}
          >
            Cadastrar novo
          </button>
        </div>
      </div>

      {/* Filtro de busca */}
      <div className="linha">
        <div className="campo">
          <label className="rotulo" htmlFor="filtro">
            Buscar por nome, e-mail ou perfil
          </label>
          <input
            id="filtro"
            className="entrada"
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Digite para filtrar…"
          />
        </div>
      </div>

      {/* Mensagens */}
      {erro && <div className="alerta erro">{erro}</div>}
      {carregando && <div className="carregando">Carregando…</div>}

      {/* Tabela */}
      {!carregando && (
        <div className="tabela-container">
          <table className="tabela">
            <thead>
              <tr>
                <th className="col-nome">Nome</th>
                <th className="col-email">E-mail</th>
                <th className="col-perfil">Perfil</th>
                <th className="col-celular">Celular</th>
                <th className="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrada.length === 0 ? (
                <tr>
                  <td colSpan={5} className="sem-registros">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filtrada.map((u) => (
                  <tr key={u.id_usuario}>
                    <td><span className="ellipsis" title={u.nome || ''}>{u.nome}</span></td>
                    <td><span className="ellipsis" title={u.email || ''}>{u.email}</span></td>
                    <td>{(u.tipo_perfil || '').toUpperCase()}</td>
                    <td>
                      {(u.ddi || '')}
                      {u.ddi ? ' ' : ''}
                      {(u.ddd || '')}
                      {u.ddd ? ' ' : ''}
                      {(u.numero_celular || '')}
                    </td>
                    <td>
                      <button
                        className="button"
                        onClick={() => editar(u.id_usuario)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Exporta componente
export default ConsultarUsuario
