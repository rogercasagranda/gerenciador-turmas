import '../../styles/ConsultarUsuario.css'
import '../../styles/ConsultarUsuario.lock.css'
// Importa React e hooks
import React, { useEffect, useMemo, useState } from 'react'
// Importa HTTP client
import axios from 'axios'
// Importa navegação
import { useNavigate } from 'react-router-dom'

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
const PERFIS_PERMITIDOS = new Set([
  'master',
  'diretor',
  'diretora',
  'secretaria',
  'coordenadora',
])

// Componente principal
const ConsultarUsuario: React.FC = () => {
  // Estados de dados
  const [lista, setLista] = useState<Usuario[]>([])
  const [filtro, setFiltro] = useState<string>('')
  const [carregando, setCarregando] = useState<boolean>(false)
  const [erro, setErro] = useState<string>('')

  // Navegação
  const navigate = useNavigate()

  // Base da API
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // Função utilitária: monta headers de autenticação
  const getAuthHeaders = () => {
    const token =
      localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    return token ? { Authorization: `Bearer ${token}` } : null
  }

  // Guarda de rota por perfil + carga inicial
  useEffect(() => {
  const carregar = async () => {
    try {
      const headers = getAuthHeaders()
      if (!headers) { navigate('/login'); return }

      // Valida perfil (tolerante a 422/500; só 401 derruba sessão)
      try {
        const m = await axios.get<MeuPerfil>(`${API_BASE}/usuarios/me`, { headers })
        const p = (m.data.tipo_perfil || '').toLowerCase()
        const autorizado = m.data.is_master || PERFIS_PERMITIDOS.has(p)
        if (!autorizado) { navigate('/home'); return }
      } catch (e:any) {
        if (e?.response?.status === 401) { navigate('/login'); return }
      }

      setCarregando(true)
      let r;
      try {
        r = await axios.get<Usuario[]>(`${API_BASE}/usuarios`, { headers })
      } catch (err:any) {
        const alt = API_BASE.includes('127.0.0.1') ? API_BASE.replace('127.0.0.1','localhost') : API_BASE.replace('localhost','127.0.0.1')
        r = await axios.get<Usuario[]>(`${alt}/usuarios`, { headers })
      }
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
            className="btn primario"
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
                        className="btn secundario"
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
