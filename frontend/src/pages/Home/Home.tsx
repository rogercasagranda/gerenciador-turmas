// Importa bibliotecas essenciais do React
import React, { useState, useEffect } from 'react'

// Importa o hook de navegação entre rotas
import { useNavigate } from 'react-router-dom'

// Importa o CSS da Home
import '../../styles/Home.css'

// Define o componente funcional da Home
const Home: React.FC = () => {
  // Controla a exibição do submenu de "Usuários"
  const [menuAberto, setMenuAberto] = useState(false)

  // Controla a exibição do menu lateral (hambúrguer)
  const [menuVisivel, setMenuVisivel] = useState(true)

  // Hook para navegação
  const navigate = useNavigate()

  // Verifica se há sessão ativa ao carregar a página
  useEffect(() => {
    // Tenta obter o item 'usuarioLogado' do localStorage
    const sessao = localStorage.getItem('usuarioLogado')

    // Se não houver sessão, redireciona para a tela de login
    if (!sessao) {
      navigate('/login')
    }
  }, [navigate]) // Executa apenas na montagem do componente

  // Alterna exibição do submenu
  const toggleMenu = () => {
    setMenuAberto(!menuAberto)
  }

  // Navega para a tela de cadastro
  const irParaCadastrar = () => {
    navigate('/usuarios/cadastrar')
    setMenuAberto(false)
  }

  // Navega para a tela de consulta
  const irParaConsultar = () => {
    navigate('/usuarios/consultar')
    setMenuAberto(false)
  }

  // Executa o logout ao clicar no botão "Sair"
  const sair = () => {
    // Remove o item 'usuarioLogado' do localStorage
    localStorage.removeItem('usuarioLogado')

    // Redireciona para a tela de login
    navigate('/login')
  }

  // Retorna o layout completo da Home
  return (
    <div className="home-container">
      {/* Cabeçalho fixo no topo */}
      <header className="home-header">
        <h1>Portal do Professor</h1>

        {/* Botão hamburguer visível apenas em telas pequenas */}
        <button
          className="hamburguer-button"
          onClick={() => setMenuVisivel(!menuVisivel)}
        >
          ☰
        </button>

        {/* Botão de logout "Sair" sempre visível quando logado */}
        <button
          className="sair-button"
          onClick={sair}
        >
          Sair
        </button>
      </header>

      {/* Corpo principal com menu lateral e conteúdo */}
      <div className="home-body">
        {/* Menu lateral visível apenas se o estado permitir */}
        {menuVisivel && (
          <aside className="home-sidebar">
            <div
              className="menu-item"
              onMouseEnter={toggleMenu}
              onMouseLeave={toggleMenu}
            >
              Usuários
              {/* Submenu suspenso */}
              {menuAberto && (
                <div className="submenu">
                  <div onClick={irParaCadastrar}>Cadastrar</div>
                  <div onClick={irParaConsultar}>Consultar</div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Conteúdo principal com carregamento condicional */}
        <main className="home-content">
          {(() => {
            if (window.location.pathname === '/usuarios/cadastrar') {
              const CadastrarUsuario = require('../Usuarios/CadastrarUsuario').default
              return <CadastrarUsuario />
            }

            if (window.location.pathname === '/usuarios/consultar') {
              const ConsultarUsuario = require('../Usuarios/ConsultarUsuario').default
              return <ConsultarUsuario />
            }

            return (
              <>
                <h2>Bem-vindo ao sistema</h2>
                <p>Selecione uma opção no menu para começar.</p>
              </>
            )
          })()}
        </main>
      </div>

      {/* Rodapé fixo no fim da tela */}
      <footer className="home-footer">
        <p>&copy; 2025 Portal do Professor</p>
      </footer>
    </div>
  )
}

// Exporta o componente Home
export default Home
