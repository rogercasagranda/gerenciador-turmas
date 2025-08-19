// Importa React e hooks necessários
import React, { useEffect, useState, useCallback, Suspense } from 'react'
// Importa utilitários de rota
import { useNavigate, useLocation } from 'react-router-dom'
// Importa CSS da Home (layout travado)
import '../../styles/Home.css'
import '../../styles/Home.lock.css'
import { loadTheme } from '../../utils/theme'

// Carrega páginas internas com import dinâmico
const CadastrarUsuario = React.lazy(() => import('../Usuarios/CadastrarUsuario'))
const ConsultarUsuario  = React.lazy(() => import('../Usuarios/ConsultarUsuario'))
const Logs = React.lazy(() => import('../Logs/Logs'))
const LogsConfig = React.lazy(() => import('../Logs/LogsConfig'))
const ThemeConfig = React.lazy(() => import('../Config/ThemeConfig'))
// Páginas de cadastro diversas
const CadTurmas = React.lazy(() => import('../Cadastro/Turmas')) // Cadastro de turmas
const CadAlunos = React.lazy(() => import('../Cadastro/Alunos')) // Cadastro de alunos
const CadDisciplinas = React.lazy(() => import('../Cadastro/Disciplinas')) // Cadastro de disciplinas
const CadTurnos = React.lazy(() => import('../Cadastro/Turnos')) // Cadastro de turnos
const CadProfessores = React.lazy(() => import('../Cadastro/Professores')) // Cadastro de professores
const CadResponsaveis = React.lazy(() => import('../Cadastro/Responsaveis')) // Cadastro de responsáveis
const CadFeriados = React.lazy(() => import('../Cadastro/Feriados')) // Cadastro de feriados
const CadAnoLetivo = React.lazy(() => import('../Cadastro/AnoLetivo')) // Cadastro de ano letivo

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const PERFIS_PERMITIDOS = new Set(['master', 'diretor', 'secretaria'])

// Converte qualquer variação de perfil para nossa forma canônica
const toCanonical = (perfil: string) => {
  const p = (perfil || '').toLowerCase()
  if (p.startsWith('diretor')) return 'diretor'
  if (p.startsWith('coordenador')) return 'coordenador'
  if (p.startsWith('professor')) return 'professor'
  if (p === 'aluno' || p === 'aluna') return 'aluno'
  return p
}

const Home: React.FC = () => {
  // Estado do drawer e submenu
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [submenuCadastroAberto, setSubmenuCadastroAberto] = useState(false) // Controle do submenu Cadastro
  const [submenuUsuariosAberto, setSubmenuUsuariosAberto] = useState(false) // Controle do submenu Usuários
  const [submenuConfigAberto, setSubmenuConfigAberto] = useState(false) // Controle do submenu Configuração
  const [submenuLogsAberto, setSubmenuLogsAberto] = useState(false) // Controle do submenu Logs
  const [podeUsuarios, setPodeUsuarios] = useState(false)
  const [isMaster, setIsMaster] = useState(false)

  // Roteamento
  const navigate = useNavigate()
  const location = useLocation()

  // Verifica sessão ativa ao montar
  useEffect(() => {
    const tokenLocal   = localStorage.getItem('auth_token')
    const tokenSession = sessionStorage.getItem('auth_token')
    const token = tokenLocal || tokenSession
    if (!token) { navigate('/login'); return }

    fetch(`${API_BASE}/usuarios/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { navigate('/login'); return null }
        return r.ok ? r.json() : null
      })
      .then(data => {
        if (!data) return
        const perfil = toCanonical(data.tipo_perfil)
        const autorizado = data.is_master || PERFIS_PERMITIDOS.has(perfil)
        setPodeUsuarios(Boolean(autorizado))
        setIsMaster(Boolean(data.is_master))
        try { localStorage.setItem('user_id', String(data.id_usuario)) } catch {}
        loadTheme()
      })
      .catch(() => {})
  }, [navigate])

  // Fecha drawer a cada navegação
  useEffect(() => {
    setDrawerAberto(false) // Fecha drawer após navegação
    setSubmenuCadastroAberto(false) // Fecha submenu Cadastro
    setSubmenuUsuariosAberto(false) // Fecha submenu Usuários
    setSubmenuConfigAberto(false) // Fecha submenu Configuração
    setSubmenuLogsAberto(false) // Fecha submenu Logs
  }, [location.pathname, location.hash])

  // Logout
  const handleLogout = useCallback(() => {
    try { localStorage.removeItem('auth_token') } catch {}
    try { sessionStorage.removeItem('auth_token') } catch {}
    try { localStorage.removeItem('usuarioLogado') } catch {}
    try { localStorage.removeItem('user_id') } catch {}
    navigate('/login')
  }, [navigate])

  // 🔧 Normaliza path (cobre BrowserRouter com basename e HashRouter)
  const getPath = () => (location.pathname + (location.hash || '')).toLowerCase()

  useEffect(() => {
    const path = getPath()
    if (path.includes('/cadastro') && !podeUsuarios) navigate('/home') // Protege rotas de cadastro
    if (path.includes('/usuarios') && !podeUsuarios) navigate('/home') // Protege rotas de usuários
    if (path.includes('/config/logs') && !isMaster) navigate('/home') // Protege área restrita de logs
  }, [location.pathname, location.hash, podeUsuarios, isMaster, navigate])

  // Renderiza conteúdo interno
  const renderConteudo = () => {
    const path = getPath()

    if (path.includes('/cadastro/turmas') && podeUsuarios) { // Página de cadastro de turmas
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadTurmas />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/alunos') && podeUsuarios) { // Página de cadastro de alunos
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadAlunos />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/disciplinas') && podeUsuarios) { // Página de cadastro de disciplinas
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadDisciplinas />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/turnos') && podeUsuarios) { // Página de cadastro de turnos
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadTurnos />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/professores') && podeUsuarios) { // Página de cadastro de professores
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadProfessores />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/responsaveis') && podeUsuarios) { // Página de cadastro de responsáveis
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadResponsaveis />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/feriados') && podeUsuarios) { // Página de cadastro de feriados
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadFeriados />
        </Suspense>
      )
    }

    if (path.includes('/cadastro/ano-letivo') && podeUsuarios) { // Página de cadastro de ano letivo
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadAnoLetivo />
        </Suspense>
      )
    }

    if (path.includes('/usuarios/cadastrar') && podeUsuarios) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <CadastrarUsuario />
        </Suspense>
      )
    }

    if (path.includes('/usuarios/consultar') && podeUsuarios) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <ConsultarUsuario />
        </Suspense>
      )
    }

    if (path.includes('/config/logs/config')) {
      if (!isMaster) {
        return (
          <section className="home-welcome">
            <h2>Sem permissão para configurar logs</h2>
          </section>
        )
      }
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <LogsConfig />
        </Suspense>
      )
    }

    if (path.includes('/config/logs')) {
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

    if (path.includes('/config/tema')) {
      return (
        <Suspense fallback={<div className="conteudo-carregando">Carregando página…</div>}>
          <ThemeConfig />
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
          <button className="btn-sair" onClick={handleLogout}>Sair</button>
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
            {podeUsuarios && ( // Menu Cadastro visível apenas a perfis autorizados
              <div
                className="nav-item"
                onMouseEnter={() => setSubmenuCadastroAberto(true)} // Abre submenu ao passar o mouse
                onMouseLeave={() => setSubmenuCadastroAberto(false)} // Fecha submenu ao sair
              >
                <button
                  className="nav-link"
                  onClick={() => setSubmenuCadastroAberto(!submenuCadastroAberto)} // Alterna abertura
                  aria-haspopup="true" // Indica que possui submenu
                  aria-expanded={submenuCadastroAberto} // Estado de expansão
                >
                  Cadastro
                  <span className={`caret ${submenuCadastroAberto ? 'caret--up' : 'caret--down'}`} />
                </button>
                <div className={`submenu ${submenuCadastroAberto ? 'submenu--open' : ''}`}> {/* Container do submenu */}
                  <button className="submenu-link" onClick={() => navigate('/cadastro/turmas')}>
                    Turmas
                  </button>
                  <button className="submenu-link" onClick={() => navigate('/cadastro/alunos')}>
                    Alunos
                  </button>
                  <button className="submenu-link" onClick={() => navigate('/cadastro/disciplinas')}>
                    Disciplinas
                  </button>
                  <button className="submenu-link" onClick={() => navigate('/cadastro/turnos')}>
                    Turnos
                  </button>
                  <button className="submenu-link" onClick={() => navigate('/cadastro/professores')}>
                    Professores
                  </button>
                  <button className="submenu-link" onClick={() => navigate('/cadastro/responsaveis')}>
                    Responsáveis
                  </button>
                  <button className="submenu-link" onClick={() => navigate('/cadastro/ano-letivo')}>
                    Ano Letivo
                  </button>
                  <button className="submenu-link" onClick={() => navigate('/cadastro/feriados')}>
                    Feriados
                  </button>
                </div>
              </div>
            )}

            {podeUsuarios && (
              <div
                className="nav-item"
                onMouseEnter={() => setSubmenuUsuariosAberto(true)}
                onMouseLeave={() => setSubmenuUsuariosAberto(false)}
              >
                <button
                  className="nav-link"
                  onClick={() => setSubmenuUsuariosAberto(!submenuUsuariosAberto)}
                  aria-haspopup="true"
                  aria-expanded={submenuUsuariosAberto}
                >
                  Usuários
                  <span className={`caret ${submenuUsuariosAberto ? 'caret--up' : 'caret--down'}`} />
                </button>

                <div className={`submenu ${submenuUsuariosAberto ? 'submenu--open' : ''}`}>
                  <button className="submenu-link" onClick={() => navigate('/usuarios/cadastrar')}>
                    Cadastrar
                  </button>
                  <button className="submenu-link" onClick={() => navigate('/usuarios/consultar')}>
                    Consultar
                  </button>
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
                <button className="submenu-link" onClick={() => navigate('/config/tema')}>
                  Configurar Tema
                </button>
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
                      <button className="submenu-link" onClick={() => navigate('/config/logs')}>
                        Verificar logs
                      </button>
                      <button className="submenu-link" onClick={() => navigate('/config/logs/config')}>
                        Configurar logs
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
      </footer>
    </div>
  )
}

export default Home
