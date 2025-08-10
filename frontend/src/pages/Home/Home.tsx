// Importa o React para construir componentes
import React, { useEffect, useState, useCallback } from 'react'

// Importa utilitários de rota para navegar e ler a URL atual
import { useNavigate, useLocation } from 'react-router-dom'

// Importa o CSS dedicado da Home (sem estilos inline)
import '../../styles/Home.css'

// Define o componente funcional da Home
const Home: React.FC = () => {
  // Controla a visibilidade do menu lateral (drawer) em telas pequenas
  const [drawerAberto, setDrawerAberto] = useState(false)
  // Controla a abertura do submenu "Usuários"
  const [submenuUsuariosAberto, setSubmenuUsuariosAberto] = useState(false)

  // Hook de navegação
  const navigate = useNavigate()
  // Hook para observar alterações na URL (carregar conteúdo no corpo)
  const location = useLocation()

  // Verifica sessão ao montar a Home
  useEffect(() => {
    // Lê o token persistido no localStorage (continuar conectado)
    const tokenLocal = localStorage.getItem('auth_token')
    // Lê o token persistido no sessionStorage (sessão atual)
    const tokenSession = sessionStorage.getItem('auth_token')
    // Se não houver token, redireciona para login
    if (!tokenLocal && !tokenSession) {
      navigate('/login')
    }
  }, [navigate])

  // Fecha o drawer ao navegar entre telas no mobile
  useEffect(() => {
    // Fecha o menu lateral quando a rota muda (melhor UX no mobile)
    setDrawerAberto(false)
  }, [location.pathname])

  // Função para logout seguro
  const handleLogout = useCallback(() => {
    // Remove o token do localStorage
    try { localStorage.removeItem('auth_token') } catch {}
    // Remove o token do sessionStorage
    try { sessionStorage.removeItem('auth_token') } catch {}
    // Remove chave antiga usada em versões anteriores (legado)
    try { localStorage.removeItem('usuarioLogado') } catch {}
    // Redireciona para login
    navigate('/login')
  }, [navigate])

  // Renderiza dinamicamente o conteúdo dentro do corpo da Home
  const renderConteudo = () => {
    // Rota de cadastro de usuários
    if (location.pathname === '/usuarios/cadastrar') {
      // Importa o componente sob demanda (evita quebra de estrutura)
      const CadastrarUsuario = require('../Usuarios/CadastrarUsuario').default
      // Retorna o conteúdo da página inserido na área principal
      return <CadastrarUsuario />
    }
    // Rota de consulta de usuários
    if (location.pathname === '/usuarios/consultar') {
      const ConsultarUsuario = require('../Usuarios/ConsultarUsuario').default
      return <ConsultarUsuario />
    }
    // Conteúdo padrão da Home
    return (
      <section className="home-welcome">
        <h2>Bem‑vindo ao Portal do Professor</h2>
        <p>Use o menu lateral para acessar as funcionalidades.</p>
      </section>
    )
  }

  // Retorna o layout completo da Home
  return (
    <div className="home-root">
      {/* Cabeçalho fixo com título e ações */}
      <header className="home-header" role="banner" aria-label="Cabeçalho do sistema">
        <div className="header-left">
          {/* Botão hambúrguer visível em telas pequenas */}
          <button
            className="icon-button"
            aria-label="Abrir menu"
            aria-expanded={drawerAberto}
            onClick={() => setDrawerAberto(!drawerAberto)}
          >
            {/* Ícone de menu (hambúrguer) usando caracteres — sem libs extras */}
            <span className="icon-lines" />
          </button>

          {/* Título do sistema */}
          <h1 className="app-title">Portal do Professor</h1>
        </div>

        <div className="header-right">
          {/* Botão sair sempre visível quando autenticado */}
          <button className="btn-sair" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      {/* Container do layout com barra lateral + conteúdo */}
      <div className="home-layout">
        {/* Backdrop para quando o drawer estiver aberto em telas pequenas */}
        {drawerAberto && <div className="backdrop" onClick={() => setDrawerAberto(false)} />}

        {/* Menu lateral (fixo no desktop, drawer no mobile) */}
        <aside
          className={`sidebar ${drawerAberto ? 'sidebar--open' : ''}`}
          role="navigation"
          aria-label="Menu lateral"
        >
          {/* Seção de navegação principal */}
          <nav className="nav">
            {/* Item com submenu: Usuários */}
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

              {/* Submenu suspenso/expansível */}
              <div className={`submenu ${submenuUsuariosAberto ? 'submenu--open' : ''}`}>
                <button
                  className="submenu-link"
                  onClick={() => navigate('/usuarios/cadastrar')}
                >
                  Cadastrar
                </button>
                <button
                  className="submenu-link"
                  onClick={() => navigate('/usuarios/consultar')}
                >
                  Consultar
                </button>
              </div>
            </div>

            {/* Exemplo de futuro módulo — mantém escalável sem alterar layout aprovado */}
            <div className="nav-item">
              <button
                className="nav-link"
                onClick={() => alert('Módulo “Turmas” em desenvolvimento.')}
              >
                Turmas
              </button>
            </div>

            <div className="nav-item">
              <button
                className="nav-link"
                onClick={() => alert('Módulo “Relatórios” em desenvolvimento.')}
              >
                Relatórios
              </button>
            </div>
          </nav>
        </aside>

        {/* Área de conteúdo onde as páginas carregam dentro da Home */}
        <main className="home-content" role="main" aria-live="polite">
          {renderConteudo()}
        </main>
      </div>

      {/* Rodapé fixo enxuto */}
      <footer className="home-footer" role="contentinfo">
        <span>© {new Date().getFullYear()} Portal do Professor</span>
      </footer>
    </div>
  )
}

// Exporta o componente Home
export default Home
