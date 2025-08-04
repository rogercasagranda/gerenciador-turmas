// Importa o React
import React from 'react';

// Importa os estilos
import '../styles/Home.css';

// Componente de eventos próximos
const EventTimeline: React.FC = () => {
  return (
    // Container da linha do tempo
    <div className="event-timeline">
      {/* Título da seção */}
      <h2 className="section-title">📅 Próximas Aulas / Eventos</h2>

      {/* Lista de eventos (estática por enquanto) */}
      <ul className="event-list">
        <li>Aula de Matemática - 13h30 - 7ºA</li>
        <li>Reunião de Pais - 16h00 - Auditório</li>
        <li>Aula de História - 10h00 - 8ºB</li>
      </ul>
    </div>
  );
};

// Exporta o componente
export default EventTimeline;
