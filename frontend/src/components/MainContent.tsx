// frontend/src/components/MainContent.tsx

// Importa o React e o tipo de propriedade
import React from 'react';
import '../styles/MainContent.css';

// Define a interface das props do componente
interface Props {
  children: React.ReactNode; // Conteúdo que será renderizado dentro do layout
}

// Componente funcional que renderiza o conteúdo principal da Home
const MainContent: React.FC<Props> = ({ children }) => {
  return (
    // Container principal que ocupa o espaço entre header e footer
    <div className="main-content">
      {children}
    </div>
  );
};

// Exporta o componente
export default MainContent;
