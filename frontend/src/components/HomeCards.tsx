// Importa React
import React from 'react';

// Importa o CSS
import '../styles/Home.css';

// Componente de cards com resumos
const HomeCards: React.FC = () => {
  return (
    // Container com todos os cards
    <div className="home-cards-container">
      {/* Card de Notas */}
      <div className="home-card">
        <div className="card-icon">📈</div>
        <div className="card-title">Notas</div>
        <div className="card-value">12 alunos</div>
      </div>

      {/* Card de Faltas */}
      <div className="home-card">
        <div className="card-icon">🎓</div>
        <div className="card-title">Faltas</div>
        <div className="card-value">3 alunos</div>
      </div>

      {/* Card de Recados */}
      <div className="home-card">
        <div className="card-icon">💬</div>
        <div className="card-title">Recados</div>
        <div className="card-value">5 pendentes</div>
      </div>

      {/* Card de Alertas */}
      <div className="home-card">
        <div className="card-icon">🔔</div>
        <div className="card-title">Alertas</div>
        <div className="card-value">2 hoje</div>
      </div>
    </div>
  );
};

// Exporta o componente
export default HomeCards;
