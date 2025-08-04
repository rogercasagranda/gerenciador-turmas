// frontend/src/components/MainContent.tsx

// Importa o React e o tipo de propriedade
import React from 'react';

// Define a interface das props do componente
interface Props {
  children: React.ReactNode; // Conteúdo que será renderizado dentro do layout
}

// Componente funcional que renderiza o conteúdo principal da Home
const MainContent: React.FC<Props> = ({ children }) => {
  return (
    // Container principal que ocupa o espaço entre header e footer
    <div
      style={{
        padding: '40px 20px',               // Espaçamento interno
        width: '100%',                      // Ocupa largura total
        minHeight: 'calc(100vh - 130px)',   // Garante altura mínima sem sobrepor header/footer
        display: 'flex',                    // Usa flexbox para centralizar conteúdo
        justifyContent: 'center',           // Centraliza horizontalmente
        alignItems: 'flex-start',           // Alinha topo verticalmente
        overflowY: 'auto'                   // Permite rolagem se necessário
      }}
    >
      {children}
    </div>
  );
};

// Exporta o componente
export default MainContent;
