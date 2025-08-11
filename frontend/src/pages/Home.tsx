// Importa React
import React from "react"; // Importa React para criar componentes

// Importa router para navegação programática
import { Link, Outlet } from "react-router-dom"; // Importa Link para navegação e Outlet para render de páginas internas

// Importa o componente do menu hambúrguer
import HamburgerMenu from "../components/HamburgerMenu"; // Importa componente criado para controlar o drawer móvel

// Importa CSS da Home (mantenha seu CSS existente; aqui não alteramos estilos aprovados)
import "../styles/Home.css"; // Importa CSS da Home (assumindo que já existe e está aprovado)

// Define componente de navegação móvel para usar dentro do drawer
const MobileNav: React.FC = () => {
  // Retorna lista de navegação usada no drawer móvel
  return (
    <nav aria-label="Navegação móvel">{/* Define nav com rótulo acessível */}
      <ul className="mobile-nav-list">{/* Define lista de itens do menu móvel */}
        <li>{/* Define item de menu */}
          <Link to="/home">{/* Define link para Home */}
            Início{/* Define texto do link */}
          </Link>
        </li>
        <li>{/* Define item de menu */}
          <Link to="/usuarios/cadastrar">{/* Define link para Cadastrar Usuário */}
            Usuários — Cadastrar{/* Define texto do link */}
          </Link>
        </li>
        <li>{/* Define item de menu */}
          <Link to="/usuarios/consultar">{/* Define link para Consultar Usuário */}
            Usuários — Consultar{/* Define texto do link */}
          </Link>
        </li>
        {/* Adicione aqui novos itens mantendo a estrutura */}
      </ul>
    </nav>
  ); // Finaliza retorno do menu móvel
}; // Finaliza MobileNav

// Exporta componente principal da Home
const Home: React.FC = () => {
  // Renderiza a estrutura fixa aprovada (cabeçalho + corpo com conteúdo dinâmico)
  return (
    <div className="home-root">{/* Mantém root da Home sem alterar layout aprovado */}
      <header className="home-header">{/* Mantém cabeçalho fixo conforme layout aprovado */}
        {/* Botão hamburguer só aparece em telas menores (controlado pelo CSS) */}
        <HamburgerMenu
          ariaLabel="Abrir menu de navegação"
          drawerContent={<MobileNav />}
        />
        {/* Mantém o título/logo ou elementos já aprovados no header */}
        <h1 className="home-title">{/* Mantém título da aplicação */}
          Portal do Professor{/* Exibe título aprovado */}
        </h1>
        {/* Mantém espaço para ações à direita do header (ex.: perfil, sair) */}
        <div className="home-header-actions">{/* Slot para ações do cabeçalho */}
          {/* Sem alterações no que já existe; se houver ícones/menus, mantê-los aqui */}
        </div>
      </header>

      {/* Mantém estrutura: sidebar/menubar fixo em desktop e body carregando páginas dentro da Home */}
      <main className="home-main">{/* Mantém container principal do conteúdo */}
        {/* Mantém área de navegação lateral já existente no desktop (não reproduzida aqui para evitar sobrescrita) */}
        {/* No mobile, a navegação é provida pelo drawer acima; em desktop, seu menu/lateral permanece como está */}

        {/* Área do corpo onde cada página deve ser renderizada (regras aprovadas) */}
        <section className="home-body">{/* Mantém área vermelha/slot central aprovado */}
          <Outlet />{/* Renderiza as rotas filhas dentro do corpo sem quebrar a estrutura */}
        </section>
      </main>

      {/* Mantém rodapé se houver (opcional) */}
      <footer className="home-footer">{/* Mantém rodapé aprovado */}
        {/* Conteúdo opcional do rodapé ou manter vazio conforme layout travado */}
      </footer>
    </div>
  ); // Finaliza retorno da Home
}; // Finaliza componente Home

// Exporta Home como padrão
export default Home; // Disponibiliza Home para rotas
