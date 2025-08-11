// Importa React e hooks necessários
import React, { useEffect, useState, useCallback, Suspense } from 'react' // Importa React, efeitos, estado, memo e Suspense
// Importa utilitários de rota
import { useNavigate, useLocation } from 'react-router-dom'               // Importa navegação e localização atual
// Importa CSS da Home (sem inline)
import '../../styles/Home.css'                                            // Aplica estilos do layout principal

// Carrega páginas internas com import dinâmico (compatível com Vite/ESM)
const CadastrarUsuario = React.lazy(                                      // Declara import preguiçoso da página de cadastro
  () => import('../Usuarios/CadastrarUsuario')                            // Define caminho do componente
)
const ConsultarUsuario = React.lazy(                                       // Declara import preguiçoso da página de consulta
  () => import('../Usuarios/ConsultarUsuario')                            // Define caminho do componente
)

// Define componente funcional da Home
const Home: React.FC = () => {
  // Controla abertura do drawer (menu hambúrguer em telas pequenas)
  const [drawerAberto, setDrawerAberto] = useState(false)                 // Inicia drawer fechado
  // Controla estado do submenu "Usuários"
  const [submenuUsuariosAberto, setSubmenuUsuariosAberto] = useState(false) // Inicia submenu fechado

  // Hooks de rota
  const navigate = useNavigate()                                          // Cria função para navegar entre rotas
  const location = useLocation()                                          // Lê a rota atual para decidir conteúdo

  // Verifica sessão ativa ao montar
  useEffect(() => {                                                       // Executa uma única vez ao montar
    const tokenLocal = localStorage.getItem('auth_token')                 // Lê token persistido (continuar conectado)
    const tokenSession = sessionStorage.getItem('auth_token')             // Lê token da sessão atual
    if (!tokenLocal && !tokenSession) {                                   // Se não houver nenhum token
      navigate('/login')                                                  // Redireciona para login
    }
  }, [navigate])                                                          // Garante estabilidade do hook

  // Fecha o drawer sempre que a rota mudar (melhor UX no mobile)
  useEffect(() => {                                                       // Observa mudanças na URL
    setDrawerAberto(false)                                                // Fecha o menu lateral
  }, [location.pathname])                                                 // Reexecuta quando a rota muda

  // Logout seguro
  const handleLogout = useCallback(() => {                                // Memoriza função de sair
    try { localStorage.removeItem('auth_token') } catch {}                // Remove token persistente
    try { sessionStorage.removeItem('auth_token') } catch {}              // Remove token de sessão
    try { localStorage.removeItem('usuarioLogado') } catch {}             // Remove chave legada
    navigate('/login')                                                    // Redireciona ao login
  }, [navigate])                                                          // Evita recriação desnecessária

  // Renderiza conteúdo dentro do corpo da Home conforme rota
  const renderConteudo = () => {                                          // Escolhe qual página mostrar
    // Normaliza path atual
    const path = location.pathname                                        // Obtém o caminho atual
    // Cadastrar usuário
    if (path.startsWith('/usuarios/cadastrar')) {                         // Verifica rota de cadastro
      return (                                                            // Retorna componente carregado sob demanda
        <Suspense fallback={<div>Carregando página…</div>}>               {/* Define fallback durante o carregamento */}
          <CadastrarUsuario />                                            {/* Renderiza cadastro */}
        </Suspense>                                                       // Encerra Suspense
      )
    }
    // Consultar usuário
    if (path.startsWith('/usuarios/consultar')) {                         // Verifica rota de consulta
      return (                                                            // Retorna componente carregado sob demanda
        <Suspense fallback={<div>Carregando página…</div>}>               {/* Define fallback durante o carregamento */}
          <ConsultarUsuario />                                            {/* Renderiza consulta */}
        </Suspense>                                                       // Encerra Suspense
      )
    }
    // Página inicial (nenhuma sub‑rota selecionada)
    return (                                                              // Exibe boas‑vindas padrão
      <section className="home-welcome">                                  {/* Aplica estilo da seção de boas‑vindas */}
        <h2>Bem‑vindo ao Portal do Professor</h2>                         {/* Título da página inicial */}
        <p>Use o menu lateral para acessar as funcionalidades.</p>        {/* Texto auxiliar */}
      </section>                                                          // Encerra seção
    )
  }

  // Retorna o layout completo da Home
  return (
    <div className="home-root">                                           {/* Container raiz do layout */}
      {/* Cabeçalho fixo */}
      <header className="home-header" role="banner" aria-label="Cabeçalho do sistema"> {/* Barra superior */}
        <div className="header-left">                                     {/* Agrupa botão e título */}
          <button                                                         // Botão hambúrguer
            className="icon-button"                                       // Classe visual do botão
            aria-label="Abrir menu"                                       // Acessibilidade
            aria-expanded={drawerAberto}                                   // Estado do drawer
            onClick={() => setDrawerAberto(!drawerAberto)}                // Alterna drawer
          >
            <span className="icon-lines" />                               {/* Ícone de três linhas */}
          </button>
          <h1 className="app-title">Portal do Professor</h1>              {/* Título do app */}
        </div>
        <div className="header-right">                                    {/* Área do botão Sair */}
          <button className="btn-sair" onClick={handleLogout}>Sair</button>{/* Botão de logout */}
        </div>
      </header>

      {/* Estrutura geral: sidebar + conteúdo */}
      <div className="home-layout">                                       {/* Grid do corpo */}
        {drawerAberto && <div className="backdrop" onClick={() => setDrawerAberto(false)} />} {/* Backdrop mobile */}

        {/* Menu lateral (fixo no desktop, drawer no mobile) */}
        <aside
          className={`sidebar ${drawerAberto ? 'sidebar--open' : ''}`}    // Aplica estado aberto/fechado
          role="navigation"                                               // Define região de navegação
          aria-label="Menu lateral"                                       // Rótulo de acessibilidade
        >
          <nav className="nav">                                           {/* Container da navegação */}
            {/* Item com submenu “Usuários” */}
            <div                                                         
              className="nav-item"                                        // Item do menu
              onMouseEnter={() => setSubmenuUsuariosAberto(true)}         // Abre no hover (desktop)
              onMouseLeave={() => setSubmenuUsuariosAberto(false)}        // Fecha ao sair (desktop)
            >
              <button
                className="nav-link"                                      // Aparência do item de menu
                onClick={() => setSubmenuUsuariosAberto(!submenuUsuariosAberto)} // Alterna no clique (mobile)
                aria-haspopup="true"                                      // Indica que possui submenu
                aria-expanded={submenuUsuariosAberto}                     // Exibe estado aberto/fechado
              >
                Usuários                                                  {/* Texto do item */}
                <span className={`caret ${submenuUsuariosAberto ? 'caret--up' : 'caret--down'}`} /> {/* Ícone de seta */}
              </button>

              <div className={`submenu ${submenuUsuariosAberto ? 'submenu--open' : ''}`}> {/* Container do submenu */}
                <button
                  className="submenu-link"                                // Aparência do link do submenu
                  onClick={() => navigate('/usuarios/cadastrar')}         // Vai para rota de cadastro
                >
                  Cadastrar                                                {/* Texto do link */}
                </button>
                <button
                  className="submenu-link"                                // Aparência do link do submenu
                  onClick={() => navigate('/usuarios/consultar')}         // Vai para rota de consulta
                >
                  Consultar                                                {/* Texto do link */}
                </button>
              </div>
            </div>

            {/* Espaços para futuros módulos (mantidos como placeholders) */}
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
          </nav>
        </aside>

        {/* Área central que carrega o conteúdo das rotas */}
        <main className="home-content" role="main" aria-live="polite">    {/* Região principal do app */}
          {renderConteudo()}                                              {/* Insere o conteúdo escolhido */}
        </main>
      </div>

      {/* Rodapé fixo */}
      <footer className="home-footer" role="contentinfo">                 {/* Área inferior */}
        <span>© {new Date().getFullYear()} Portal do Professor</span>     {/* Texto do rodapé */}
      </footer>
    </div>
  )
}

// Exporta o componente Home
export default Home                                                      // Disponibiliza o componente
