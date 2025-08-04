// frontend/src/pages/Home/Home.tsx

// Importa os hooks e estilos do React
import React from 'react';
import './Home.css'; // CSS específico da página Home

// Componente principal da tela Home
const Home: React.FC = () => {
  return (
    <div className="home-container">
      <h1>Bem-vindo ao Portal do Professor</h1>
      <p>Sistema de gestão educacional — selecione uma opção no menu superior.</p>
    </div>
  );
};

export default Home;
