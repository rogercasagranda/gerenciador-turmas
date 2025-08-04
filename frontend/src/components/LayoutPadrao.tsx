// Importa React e o Outlet do react-router
import React from 'react';
import { Outlet } from 'react-router-dom';

// Importa os componentes fixos da Home
import HomeHeader from './HomeHeader';
import Footer from './Footer';

// Importa o CSS da tela Home
import '../styles/Home.css';

// Componente de layout padrão com cabeçalho, menu e rodapé fixos
const LayoutPadrao: React.FC = () => {
  return (
    <div className="home-container">
      {/* Cabeçalho fixo */}
      <HomeHeader />

      {/* Menu fixo */}
      <nav className="home-navbar">
        <a href="#">🏠 Início</a>
        <a href="#">📚 Turmas</a>
        <a href="#">🧑‍🏫 Professores</a>
        <a href="#">📊 Relatórios</a>

        {/* Dropdown de usuários */}
        <div className="menu-usuarios-wrapper">
          <span className="menu-usuarios">👥 Usuários ▾</span>
          <div className="submenu-usuarios">
            <a href="/usuarios/cadastrar">➕ Cadastrar</a>
            <a href="/usuarios/consultar">🔍 Consultar</a>
          </div>
        </div>

        <a href="#">⚙️ Configurações</a>
      </nav>

      {/* Área dinâmica que muda conforme rota */}
      <main className="home-content">
        <Outlet />
      </main>

      {/* Rodapé fixo */}
      <Footer />
    </div>
  );
};

export default LayoutPadrao;
