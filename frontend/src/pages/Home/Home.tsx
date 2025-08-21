// Importa React e hooks necessários
import React, { useEffect, useState, useCallback, Suspense, useMemo } from 'react'
// Importa utilitários de rota
import { useNavigate, useLocation } from 'react-router-dom'
// Importa CSS da Home (layout travado)
import '../../styles/Home.css'
import '../../styles/Home.lock.css'
import { loadThemeFromStorage } from '../../theme/utils'
import { apiFetch, getAuthToken } from '@/services/api'

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

  // Roteamento
  const navigate = useNavigate()
  const location = useLocation()

  const fetchPermissions = useCallback(() => {
    apiFetch('/me/permissions/effective')
      .then((data: Record<string, Record<string, boolean>>) => {
        const perms = data || {}
        setPermissions(perms)
        try { localStorage.setItem('permissions.effective', JSON.stringify(perms)) } catch {}
      })
      .catch(() => setPermissions({}))
  }, [])

  // Verifica sessão ativa ao montar
  useEffect(() => {
    const token = getAuthToken()
    if (!token) { navigate('/login'); return }

    apiFetch('/usuarios/me')
      .then((data: any) => {
        if (!data) return
        const perfil = toCanonical(data.tipo_perfil)
        setIsMaster(Boolean(data.is_master))
        try { localStorage.setItem('user_id', String(data.id_usuario)) } catch {}
        loadThemeFromStorage()
        fetchPermissions()
      })
      .catch(() => {
        const claims = getClaimsFromToken()
        const perfil = toCanonical(
          (claims?.role || claims?.perfil || claims?.tipo_perfil || '') as string,
        )
        const isMaster = perfil === 'master'
        setIsMaster(isMaster)
      })
  }, [navigate, fetchPermissions])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('permissions.effective')
      if (raw) setPermissions(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    const handler = () => fetchPermissions()
    window.addEventListener('permissions:refresh', handler)
    return () => window.removeEventListener('permissions:refresh', handler)
  }, [fetchPermissions])

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
    try { localStorage.removeItem('auth_token') } catch {}
    try { sessionStorage.removeItem('auth_token') } catch {}
    try { localStorage.removeItem('usuarioLogado') } catch {}
    try { localStorage.removeItem('user_id') } catch {}
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
      const ops = permissions[p]
      if (!ops) return false
      return op ? !!ops[op] : Object.values(ops).some(Boolean)
    },
    [permissions],
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
  const renderConteudo = () => {
    const path = getPath()

    if (path.includes('/cadastro/turmas') && can('/cadastro/turmas', 'view')) { // Página de cadastro de turmas
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadTurmas />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/alunos') && can('/cadastro/alunos', 'view')) { // Página de cadastro de alunos
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadAlunos />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/disciplinas') && can('/cadastro/disciplinas', 'view')) { // Página de cadastro de disciplinas
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadDisciplinas />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/turnos') && can('/cadastro/turnos', 'view')) { // Página de cadastro de turnos
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadTurnos />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/professores') && can('/cadastro/professores', 'view')) { // Página de cadastro de professores
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadProfessores />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/responsaveis') && can('/cadastro/responsaveis', 'view')) { // Página de cadastro de responsáveis
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadResponsaveis />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/feriados') && can('/cadastro/feriados', 'view')) { // Página de cadastro de feriados
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadFeriados />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/ano-letivo') && can('/cadastro/ano-letivo', 'view')) { // Página de cadastro de ano letivo
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadAnoLetivo />
        </Suspense>
      )
    }

    if (path.includes('/configuracao/usuarios/cadastrar') && can('/configuracao/usuarios/cadastrar', 'view')) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadastrarUsuario />
        </Suspense>
      )
    }

    if (path.includes('/configuracao/usuarios/consultar') && can('/configuracao/usuarios/consultar', 'view')) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <ConsultarUsuario />
        </Suspense>
      )
    }

    if (path.includes('/configuracao/acessos/consultar') && can('/configuracao/acessos/consultar', 'view')) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <AcessosConsultar />
        </Suspense>
      )
    }

    if (path.includes('/configuracao/acessos/usuario') && can('/configuracao/acessos/usuario', 'view')) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <AcessoUsuario />
        </Suspense>
      )
    }

    if (path.includes('/configuracao/acessos/grupo') && can('/configuracao/acessos/grupo', 'view')) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <AcessoGrupo />
        </Suspense>
      )
    }

    if (path.includes('/configuracao/ano-letivo') && can('/configuracao/ano-letivo', 'view')) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <ConfigAnoLetivo />
        </Suspense>
      )
    }

    if (path.includes('/configuracao/logs')) {
      if (!isMaster) {
        return (
          <section className="home-welcome">
            <h2>Sem permissão para acessar os logs</h2>
          </section>
        )
      }
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <Logs />
        </Suspense>
      )
    }

    if (path.includes('/configuracao/tema') && can('/configuracao/tema', 'view')) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <ConfigurarTema />
        </Suspense>
      )
    }

    if (path.includes('/403')) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <Forbidden />
        </Suspense>
      )
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
            className="icon-button"
            aria-label="Abrir menu"
            aria-expanded={drawerAberto}
            onClick={() => setDrawerAberto(!drawerAberto)}
          >
            <span className="icon-lines" />
          </button>
          <h1 className="app-title">Portal do Professor</h1>
        </div>
        <div className="header-right">
          <button className="button-exit" onClick={handleLogout}>Sair</button>
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
                  className="nav-item"
                  onMouseEnter={() => setSubmenuCadastroAberto(true)}
                  onMouseLeave={() => setSubmenuCadastroAberto(false)}
                >
                  <button
                    className="nav-link"
                    onClick={() => setSubmenuCadastroAberto(!submenuCadastroAberto)}
                    aria-haspopup="true"
                    aria-expanded={submenuCadastroAberto}
                  >
                    Cadastro
                    <span className={`caret ${submenuCadastroAberto ? 'caret--up' : 'caret--down'}`} />
                  </button>
                  <div className={`submenu ${submenuCadastroAberto ? 'submenu--open' : ''}`}>
                    {can('/cadastro/turmas') && (
                      <button className="submenu-link" onClick={() => navigate('/cadastro/turmas')}>
                        Turmas
                      </button>
                    )}
                    {can('/cadastro/alunos') && (
                      <button className="submenu-link" onClick={() => navigate('/cadastro/alunos')}>
                        Alunos
                      </button>
                    )}
                    {can('/cadastro/disciplinas') && (
                      <button className="submenu-link" onClick={() => navigate('/cadastro/disciplinas')}>
                        Disciplinas
                      </button>
                    )}
                    {can('/cadastro/turnos') && (
                      <button className="submenu-link" onClick={() => navigate('/cadastro/turnos')}>
                        Turnos
                      </button>
                    )}
                    {can('/cadastro/professores') && (
                      <button className="submenu-link" onClick={() => navigate('/cadastro/professores')}>
                        Professores
                      </button>
                    )}
                    {can('/cadastro/responsaveis') && (
                      <button className="submenu-link" onClick={() => navigate('/cadastro/responsaveis')}>
                        Responsáveis
                      </button>
                    )}
                    {can('/cadastro/ano-letivo') && (
                      <button className="submenu-link" onClick={() => navigate('/cadastro/ano-letivo')}>
                        Ano Letivo
                      </button>
                    )}
                    {can('/cadastro/feriados') && (
                      <button className="submenu-link" onClick={() => navigate('/cadastro/feriados')}>
                        Feriados
                      </button>
                    )}
                  </div>
                </div>
              )}

            <div className="nav-item">
              <button className="nav-link" onClick={() => alert('Módulo “Turmas” em desenvolvimento.')}> 
                Turmas
              </button>
            </div>

            <div className="nav-item">
              <button className="nav-link" onClick={() => alert('Módulo “Relatórios” em desenvolvimento.')}>
                Relatórios
              </button>
            </div>

            <div
              className="nav-item"
              onMouseEnter={() => setSubmenuConfigAberto(true)}
              onMouseLeave={() => setSubmenuConfigAberto(false)}
            >
              <button
                className="nav-link"
                onClick={() => setSubmenuConfigAberto(!submenuConfigAberto)}
                aria-haspopup="true"
                aria-expanded={submenuConfigAberto}
              >
                Configuração
                <span className={`caret ${submenuConfigAberto ? 'caret--up' : 'caret--down'}`} />
              </button>
              <div className={`submenu ${submenuConfigAberto ? 'submenu--open' : ''}`}>
                {can('/configuracao/tema') && (
                  <button className="submenu-link" onClick={() => navigate('/configuracao/tema')}>
                    Configurar Tema
                  </button>
                )}
                {can('/configuracao/ano-letivo') && (
                  <button className="submenu-link" onClick={() => navigate('/configuracao/ano-letivo')}>
                    Ano Letivo
                  </button>
                )}

                {(can('/configuracao/acessos/consultar') ||
                  can('/configuracao/acessos/usuario') ||
                  can('/configuracao/acessos/grupo')) && (
                  <div
                    className="nav-item"
                    onMouseEnter={() => setSubmenuAcessosAberto(true)}
                    onMouseLeave={() => setSubmenuAcessosAberto(false)}
                  >
                    <button
                      className="submenu-link"
                      onClick={() => setSubmenuAcessosAberto(!submenuAcessosAberto)}
                      aria-haspopup="true"
                      aria-expanded={submenuAcessosAberto}
                    >
                      Acessos e Permissões
                      <span className={`caret ${submenuAcessosAberto ? 'caret--up' : 'caret--down'}`} />
                    </button>
                    <div className={`submenu ${submenuAcessosAberto ? 'submenu--open' : ''}`}>
                      {can('/configuracao/acessos/consultar') && (
                        <button className="submenu-link" onClick={() => navigate('/configuracao/acessos/consultar')}>
                          Consultar
                        </button>
                      )}
                      {can('/configuracao/acessos/usuario') && (
                        <button className="submenu-link" onClick={() => navigate('/configuracao/acessos/usuario')}>
                          Usuário
                        </button>
                      )}
                      {can('/configuracao/acessos/grupo') && (
                        <button className="submenu-link" onClick={() => navigate('/configuracao/acessos/grupo')}>
                          Grupo
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {(can('/configuracao/usuarios/cadastrar') ||
                  can('/configuracao/usuarios/consultar')) && (
                  <div
                    className="nav-item"
                    onMouseEnter={() => setSubmenuUsuariosAberto(true)}
                    onMouseLeave={() => setSubmenuUsuariosAberto(false)}
                  >
                    <button
                      className="submenu-link"
                      onClick={() => setSubmenuUsuariosAberto(!submenuUsuariosAberto)}
                      aria-haspopup="true"
                      aria-expanded={submenuUsuariosAberto}
                    >
                      Usuários
                      <span className={`caret ${submenuUsuariosAberto ? 'caret--up' : 'caret--down'}`} />
                    </button>
                    <div className={`submenu ${submenuUsuariosAberto ? 'submenu--open' : ''}`}>
                      {can('/configuracao/usuarios/cadastrar') && (
                        <button className="submenu-link" onClick={() => navigate('/configuracao/usuarios/cadastrar')}>
                          Cadastrar
                        </button>
                      )}
                      {can('/configuracao/usuarios/consultar') && (
                        <button className="submenu-link" onClick={() => navigate('/configuracao/usuarios/consultar')}>
                          Consultar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isMaster && (
                  <div
                    className="nav-item"
                    onMouseEnter={() => setSubmenuLogsAberto(true)}
                    onMouseLeave={() => setSubmenuLogsAberto(false)}
                  >
                    <button
                      className="submenu-link"
                      onClick={() => setSubmenuLogsAberto(!submenuLogsAberto)}
                      aria-haspopup="true"
                      aria-expanded={submenuLogsAberto}
                    >
                      Logs
                      <span className={`caret ${submenuLogsAberto ? 'caret--up' : 'caret--down'}`} />
                    </button>
                    <div className={`submenu ${submenuLogsAberto ? 'submenu--open' : ''}`}>
                      <button className="submenu-link" onClick={() => navigate('/configuracao/logs?tab=overview')}>
                        Visão geral
                      </button>
                      <button className="submenu-link" onClick={() => navigate('/configuracao/logs?tab=config')}>
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
