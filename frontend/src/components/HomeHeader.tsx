// Importa o React e os hooks do React
import React from 'react';

// Importa o arquivo de estilos para o componente
import '../styles/Home.css';

// Componente de cabeçalho da Home
const HomeHeader: React.FC = () => {
  return (
    // Container principal do cabeçalho
    <header className="home-header">
      {/* Logotipo ou nome da instituição */}
      <div className="home-logo">Portal do Professor</div>

      {/* Área com ícones de notificação e usuário */}
      <div className="home-header-actions">
        {/* Ícone de notificações */}
        <button className="button icon-button" title="Notificações">🔔</button>

        {/* Ícone do usuário */}
        <button className="button icon-button" title="Perfil do usuário">👤</button>
      </div>
    </header>
  );
};

// Exporta o componente
export default HomeHeader;
