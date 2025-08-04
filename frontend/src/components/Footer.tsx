// Importa React
import React from 'react';

// Importa o CSS
import '../styles/Home.css';

// Componente do rodapé da página
const Footer: React.FC = () => {
  return (
    // Container do rodapé
    <footer className="footer">
      {/* Conteúdo do rodapé */}
      <p>© 2025 Portal do Professor - Todos os direitos reservados</p>
    </footer>
  );
};

// Exporta o componente
export default Footer;
