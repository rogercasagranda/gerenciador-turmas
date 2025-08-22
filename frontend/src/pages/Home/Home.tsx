// Importa React e hooks necessários
import React, { useEffect, useState, useCallback, Suspense, useMemo, useRef } from 'react'
// Importa utilitários de rota
import { useLocation } from 'react-router-dom'
import useBaseNavigate from '@/hooks/useBaseNavigate'
// Importa CSS da Home (layout travado)
import '../../styles/Home.css'
import '../../styles/Home.lock.css'
import { initTheme } from '../../utils/theme'
import { authFetch, getAuthToken, logoutLocal } from '@/services/api'

const toCanonical = (perfil: string) => (perfil || '').toLowerCase()

// Carrega páginas internas com import dinâmico
const CadastrarUsuario = React.lazy(() => import('../Usuarios/CadastrarUsuario'))
const ConsultarUsuario  = React.lazy(() => import('../Usuarios/ConsultarUsuario'))
const Logs = React.lazy(() => import('../Logs/Logs'))
const ConfigurarTema = React.lazy(() => import('../Configuracoes/ConfigurarTema'))
const ConfigAnoLetivo = React.lazy(() => import('../Configuracoes/AnoLetivo/AnoLetivoPage'))
const AcessosConsultar = React.lazy(() => import('../Configuracoes/Acessos/Consultar'))
const AcessoUsuario = React.lazy(() => import('../Configuracoes/Acessos/Usuario'))
const AcessoGrupo = React.lazy(() => import('../Configuracoes/Acessos/Grupo'))
const Forbidden = React.lazy(() => import('../Forbidden'))
// Páginas de cadastro diversas
const CadTurmas = React.lazy(() => import('../Cadastro/Turmas')) // Cadastro de turmas
const CadAlunos = React.lazy(() => import('../Cadastro/Alunos')) // Cadastro de alunos
const CadDisciplinas = React.lazy(() => import('../Cadastro/Disciplinas')) // Cadastro de disciplinas
const CadTurnos = React.lazy(() => import('../Cadastro/Turnos')) // Cadastro de turnos
const CadProfessores = React.lazy(() => import('../Cadastro/Professores')) // Cadastro de professores
const CadResponsaveis = React.lazy(() => import('../Cadastro/Responsaveis')) // Cadastro de responsáveis
const CadFeriados = React.lazy(() => import('../Feriados/Feriados')) // Cadastro de feriados

const CadAnoLetivo = React.lazy(() => import('../Cadastro/AnoLetivo')) // Cadastro de ano letivo



// Decodifica payload do JWT quando chamada à API falha
const getClaimsFromToken = () => {
  const token = getAuthToken()
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try { return JSON.parse(atob(parts[1])) } catch { return null }
}

const Home: React.FC = () => {
  // Estado do drawer e submenu
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [submenuCadastroAberto, setSubmenuCadastroAberto] = useState(false) // Controle do submenu Cadastro
  const [submenuUsuariosAberto, setSubmenuUsuariosAberto] = useState(false) // Controle do submenu Usuários
  const [submenuConfigAberto, setSubmenuConfigAberto] = useState(false) // Controle do submenu Configuração
  const [submenuLogsAberto, setSubmenuLogsAberto] = useState(false) // Controle do submenu Logs
  const [submenuAcessosAberto, setSubmenuAcessosAberto] = useState(false) // Controle do submenu Acessos
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({})
  const [isMaster, setIsMaster] = useState(false)

  const cadastroRef = useRef<HTMLDivElement>(null)
  const usuariosRef = useRef<HTMLDivElement>(null)
  const configRef = useRef<HTMLDivElement>(null)
  const logsRef = useRef<HTMLDivElement>(null)
  const acessosRef = useRef<HTMLDivElement>(null)

  const loadPermissions = useCallback(() => {
    try {
      const raw = localStorage.getItem('permissions.effective')
      const parsed = raw ? JSON.parse(raw) : {}
      if (Array.isArray(parsed) && parsed.includes('*')) {
        setIsMaster(true)
        setPermissions({})
      } else {
        setPermissions(parsed || {})
      }
    } catch {
      setPermissions({})
    }
  }, [])

  // Roteamento
  const navigate = useBaseNavigate()
  const location = useLocation()


  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  useEffect(() => {
    const handler = () => loadPermissions()
    window.addEventListener('permissions:updated', handler)
    return () => window.removeEventListener('permissions:updated', handler)
  }, [loadPermissions])

// Verifica sessão ativa ao montar e carrega permissões
  useEffect(() => {
    const token = getAuthToken()
    if (!token) { navigate('/login'); return }

    authFetch('/me/permissions/effective')
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data: any = await res.json()
        const { role, permissions: perms = {}, id } = data
        const master = role === 'MASTER' || (Array.isArray(perms) && perms.includes('*'))
        setIsMaster(master)
        if (master) {
          setPermissions({})
          try { localStorage.setItem('permissions.effective', JSON.stringify(['*'])) } catch {}
        } else {
          setPermissions(perms)
          try { localStorage.setItem('permissions.effective', JSON.stringify(perms)) } catch {}
        }
        if (id) try { localStorage.setItem('user_id', String(id)) } catch {}
        initTheme()
      })
      .catch(() => {
        const claims = getClaimsFromToken()
        const perms = claims?.permissions || claims?.permissoes
        const role = (claims?.role || claims?.perfil || claims?.tipo_perfil || '').toUpperCase()
        const master = role === 'MASTER' || (Array.isArray(perms) && perms.includes('*'))
        setIsMaster(master)
      })
    }, [navigate])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cadastroRef.current && !cadastroRef.current.contains(e.target as Node)) {
        setSubmenuCadastroAberto(false)
      }
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setSubmenuConfigAberto(false)
      }
      if (acessosRef.current && !acessosRef.current.contains(e.target as Node)) {
        setSubmenuAcessosAberto(false)
      }
      if (usuariosRef.current && !usuariosRef.current.contains(e.target as Node)) {
        setSubmenuUsuariosAberto(false)
      }
      if (logsRef.current && !logsRef.current.contains(e.target as Node)) {
        setSubmenuLogsAberto(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSubmenuCadastroAberto(false)
        setSubmenuConfigAberto(false)
        setSubmenuAcessosAberto(false)
        setSubmenuUsuariosAberto(false)
        setSubmenuLogsAberto(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Fecha drawer a cada navegação
  useEffect(() => {
    setDrawerAberto(false) // Fecha drawer após navegação
    setSubmenuCadastroAberto(false) // Fecha submenu Cadastro
    setSubmenuUsuariosAberto(false) // Fecha submenu Usuários
    setSubmenuConfigAberto(false) // Fecha submenu Configuração
    setSubmenuLogsAberto(false) // Fecha submenu Logs
    setSubmenuAcessosAberto(false) // Fecha submenu Acessos
  }, [location.pathname, location.hash])

  // Logout
  const handleLogout = useCallback(() => {
    authFetch('/logout', { method: 'POST' }).catch(() => {})
    logoutLocal()
    try { localStorage.removeItem('permissions.effective') } catch {}
    navigate('/login')
  }, [navigate])

  // 🔧 Normaliza path (cobre BrowserRouter com basename e HashRouter)
  const getPath = () => (location.pathname + (location.hash || '')).toLowerCase()

  useEffect(() => {
    const path = getPath()

    if (path.includes('/configuracao/logs') && !isMaster) navigate('/home')
  }, [location.pathname, location.hash, isMaster, navigate])

  const can = useCallback(
    (p: string, op?: string) => {
      if (isMaster) return true
      const ops = permissions[p]
      if (!ops) return false
      return op ? !!ops[op] : Object.values(ops).some(Boolean)
    },
    [permissions, isMaster],
  )

  const canCadastro = useMemo(() => {
    const paths = [
      '/cadastro/turmas',
      '/cadastro/alunos',
      '/cadastro/disciplinas',
      '/cadastro/turnos',
      '/cadastro/professores',
      '/cadastro/responsaveis',
      '/cadastro/ano-letivo',
      '/cadastro/feriados',
    ]
    return paths.some((p) => can(p))
  }, [can])


  // Renderiza conteúdo interno
  const renderWithAuth = (allowed: boolean, node: React.ReactNode) => (
    <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
      {allowed ? node : <Forbidden />}
    </Suspense>
  )

  const renderConteudo = () => {
    const path = getPath()

    if (path.includes('/cadastro/turmas')) {
      return renderWithAuth(can('/cadastro/turmas', 'view'), <CadTurmas />)
    }

    if (path.includes('/cadastro/alunos')) {
      return renderWithAuth(can('/cadastro/alunos', 'view'), <CadAlunos />)
    }

    if (path.includes('/cadastro/disciplinas')) {
      return renderWithAuth(can('/cadastro/disciplinas', 'view'), <CadDisciplinas />)
    }

    if (path.includes('/cadastro/turnos')) {
      return renderWithAuth(can('/cadastro/turnos', 'view'), <CadTurnos />)
    }

    if (path.includes('/cadastro/professores')) {
      return renderWithAuth(can('/cadastro/professores', 'view'), <CadProfessores />)
    }

    if (path.includes('/cadastro/responsaveis')) {
      return renderWithAuth(can('/cadastro/responsaveis', 'view'), <CadResponsaveis />)
    }

    if (path.includes('/cadastro/feriados')) {
      return renderWithAuth(can('/cadastro/feriados', 'view'), <CadFeriados />)
    }

    if (path.includes('/cadastro/ano-letivo')) {
      return renderWithAuth(can('/cadastro/ano-letivo', 'view'), <CadAnoLetivo />)
    }

    if (path.includes('/configuracao/usuarios/cadastrar')) {
      return renderWithAuth(
        can('/configuracao/usuarios/cadastrar', 'view'),
        <CadastrarUsuario />,
      )
    }

    if (path.includes('/configuracao/usuarios/consultar')) {
      return renderWithAuth(
        can('/configuracao/usuarios/consultar', 'view'),
        <ConsultarUsuario />,
      )
    }

    if (path.includes('/configuracao/acessos/consultar')) {
      return renderWithAuth(
        can('/configuracao/acessos/consultar', 'view'),
        <AcessosConsultar />,
      )
    }

    if (path.includes('/configuracao/acessos/usuario')) {
      return renderWithAuth(
        can('/configuracao/acessos/usuario', 'view'),
        <AcessoUsuario />,
      )
    }

    if (path.includes('/configuracao/acessos/grupo')) {
      return renderWithAuth(
        can('/configuracao/acessos/grupo', 'view'),
        <AcessoGrupo />,
      )
    }

    if (path.includes('/configuracao/ano-letivo')) {
      return renderWithAuth(can('/configuracao/ano-letivo', 'view'), <ConfigAnoLetivo />)
    }

    if (path.includes('/configuracao/logs')) {
      if (!isMaster) {
        return (
          <section className="home-welcome">
            <h2>Sem permissão para acessar os logs</h2>
          </section>
        )
      }
      return renderWithAuth(true, <Logs />)
    }

    if (path.includes('/configuracao/tema')) {
      return renderWithAuth(can('/configuracao/tema', 'view'), <ConfigurarTema />)
    }

    if (path.includes('/403')) {
      return renderWithAuth(true, <Forbidden />)
    }

    return (
      <section className="home-welcome">
        <h2>Bem-vindo ao Portal do Professor</h2>
        <p>Use o menu lateral para acessar as funcionalidades.</p>
      </section>
    )
  }

  return (
    <div className="home-root">
      {/* Cabeçalho */}
      <header className="home-header" role="banner" aria-label="Cabeçalho do sistema">
        <div className="header-left">
          <button
            className="btn btn-md icon-button"
            aria-label="Abrir menu"
            aria-expanded={drawerAberto}
            onClick={() => setDrawerAberto(!drawerAberto)}
          >
            <span className="icon-lines" />
          </button>
          <h1 className="app-title">Portal do Professor</h1>
        </div>
        <div className="header-right">
          <button className="btn btn-md button-exit" onClick={handleLogout}>Sair</button>
        </div>
      </header>

      {/* Layout com sidebar + conteúdo */}
      <div className="home-layout">
        {drawerAberto && <div className="backdrop" onClick={() => setDrawerAberto(false)} />}

        <aside
          className={`sidebar ${drawerAberto ? 'sidebar--open' : ''}`}
          role="navigation"
          aria-label="Menu lateral"
        >
            <nav className="nav">
                {canCadastro && (
                  <div
                    className={`nav-item ${submenuCadastroAberto ? 'is-open' : ''}`}
                    ref={cadastroRef}
                  >
                    <button
                      className="btn btn-md nav-link"
                      onClick={() => setSubmenuCadastroAberto(!submenuCadastroAberto)}
                      aria-haspopup="true"
                      aria-expanded={submenuCadastroAberto}
                    >
                      Cadastro
                      <span className={`caret ${submenuCadastroAberto ? 'caret--up' : 'caret--down'}`} />
                    </button>
                    <div className="submenu">
                      {can('/cadastro/turmas') && (
                        <button className="btn btn-md submenu-link" onClick={() => navigate('/cadastro/turmas')}>
                          Turmas
                        </button>
                      )}
                    {can('/cadastro/alunos') && (
                      <button className="btn btn-md submenu-link" onClick={() => navigate('/cadastro/alunos')}>
                        Alunos
                      </button>
                    )}
                    {can('/cadastro/disciplinas') && (
                      <button className="btn btn-md submenu-link" onClick={() => navigate('/cadastro/disciplinas')}>
                        Disciplinas
                      </button>
                    )}
                    {can('/cadastro/turnos') && (
                      <button className="btn btn-md submenu-link" onClick={() => navigate('/cadastro/turnos')}>
                        Turnos
                      </button>
                    )}
                    {can('/cadastro/professores') && (
                      <button className="btn btn-md submenu-link" onClick={() => navigate('/cadastro/professores')}>
                        Professores
                      </button>
                    )}
                    {can('/cadastro/responsaveis') && (
                      <button className="btn btn-md submenu-link" onClick={() => navigate('/cadastro/responsaveis')}>
                        Responsáveis
                      </button>
                    )}
                    {can('/cadastro/ano-letivo') && (
                      <button className="btn btn-md submenu-link" onClick={() => navigate('/cadastro/ano-letivo')}>
                        Ano Letivo
                      </button>
                    )}
                    {can('/cadastro/feriados') && (
                      <button className="btn btn-md submenu-link" onClick={() => navigate('/cadastro/feriados')}>
                        Feriados
                      </button>
                    )}
                  </div>
                </div>
              )}

            <div className="nav-item">
              <button className="btn btn-md nav-link" onClick={() => alert('Módulo “Turmas” em desenvolvimento.')}> 
                Turmas
              </button>
            </div>

            <div className="nav-item">
              <button className="btn btn-md nav-link" onClick={() => alert('Módulo “Relatórios” em desenvolvimento.')}>
                Relatórios
              </button>
            </div>

              <div
                className={`nav-item ${submenuConfigAberto ? 'is-open' : ''}`}
                ref={configRef}
              >
                <button
                  className="btn btn-md nav-link"
                  onClick={() => setSubmenuConfigAberto(!submenuConfigAberto)}
                  aria-haspopup="true"
                  aria-expanded={submenuConfigAberto}
                >
                  Configuração
                  <span className={`caret ${submenuConfigAberto ? 'caret--up' : 'caret--down'}`} />
                </button>
                <div className="submenu">
                  {can('/configuracao/tema') && (
                    <button className="btn btn-md submenu-link" onClick={() => navigate('/configuracao/tema')}>
                      Configurar Tema
                    </button>
                  )}
                {can('/configuracao/ano-letivo') && (
                  <button className="btn btn-md submenu-link" onClick={() => navigate('/configuracao/ano-letivo')}>
                    Ano Letivo
                  </button>
                )}

                  {(can('/configuracao/acessos/consultar') ||
                    can('/configuracao/acessos/usuario') ||
                    can('/configuracao/acessos/grupo')) && (
                    <div
                      className={`nav-item ${submenuAcessosAberto ? 'is-open' : ''}`}
                      ref={acessosRef}
                    >
                      <button
                        className="btn btn-md submenu-link"
                        onClick={() => setSubmenuAcessosAberto(!submenuAcessosAberto)}
                        aria-haspopup="true"
                        aria-expanded={submenuAcessosAberto}
                      >
                        Acessos e Permissões
                        <span className={`caret ${submenuAcessosAberto ? 'caret--up' : 'caret--down'}`} />
                      </button>
                      <div className="submenu">
                        {can('/configuracao/acessos/consultar') && (
                          <button className="btn btn-md submenu-link" onClick={() => navigate('/configuracao/acessos/consultar')}>
                            Consultar
                          </button>
                        )}
                      {can('/configuracao/acessos/usuario') && (
                        <button className="btn btn-md submenu-link" onClick={() => navigate('/configuracao/acessos/usuario')}>
                          Usuário
                        </button>
                      )}
                      {can('/configuracao/acessos/grupo') && (
                        <button className="btn btn-md submenu-link" onClick={() => navigate('/configuracao/acessos/grupo')}>
                          Grupo
                        </button>
                      )}
                    </div>
                  </div>
                )}

                  {(can('/configuracao/usuarios/cadastrar') ||
                    can('/configuracao/usuarios/consultar')) && (
                    <div
                      className={`nav-item ${submenuUsuariosAberto ? 'is-open' : ''}`}
                      ref={usuariosRef}
                    >
                      <button
                        className="btn btn-md submenu-link"
                        onClick={() => setSubmenuUsuariosAberto(!submenuUsuariosAberto)}
                        aria-haspopup="true"
                        aria-expanded={submenuUsuariosAberto}
                      >
                        Usuários
                        <span className={`caret ${submenuUsuariosAberto ? 'caret--up' : 'caret--down'}`} />
                      </button>
                      <div className="submenu">
                        {can('/configuracao/usuarios/cadastrar') && (
                          <button className="btn btn-md submenu-link" onClick={() => navigate('/configuracao/usuarios/cadastrar')}>
                            Cadastrar
                          </button>
                        )}
                      {can('/configuracao/usuarios/consultar') && (
                        <button className="btn btn-md submenu-link" onClick={() => navigate('/configuracao/usuarios/consultar')}>
                          Consultar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                  {isMaster && (
                    <div
                      className={`nav-item ${submenuLogsAberto ? 'is-open' : ''}`}
                      ref={logsRef}
                    >
                      <button
                        className="btn btn-md submenu-link"
                        onClick={() => setSubmenuLogsAberto(!submenuLogsAberto)}
                        aria-haspopup="true"
                        aria-expanded={submenuLogsAberto}
                      >
                        Logs
                        <span className={`caret ${submenuLogsAberto ? 'caret--up' : 'caret--down'}`} />
                      </button>
                      <div className="submenu">
                        <button className="btn btn-md submenu-link" onClick={() => navigate('/configuracao/logs?tab=overview')}>
                          Visão geral
                        </button>
                        <button className="btn btn-md submenu-link" onClick={() => navigate('/configuracao/logs?tab=config')}>
                          Configurar
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </aside>

        <main className="home-content" role="main" aria-live="polite">
          {renderConteudo()}
        </main>
      </div>

      {/* Rodapé */}
      <footer className="home-footer" role="contentinfo">
        <span>© {new Date().getFullYear()} Portal do Professor</span>
        <a href="/politica-de-cookies">Política de Cookies</a>
      </footer>
    </div>
  )
}

export default Home
