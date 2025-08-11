// Importa bibliotecas do React e do roteador
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Importa páginas
import Login from './components/Login'
import Home from './pages/Home/Home'

// Componente principal da aplicação
const App: React.FC = () => {
  return (
    <Routes>
      {/* Redireciona a raiz para a tela de login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Tela de login (layout travado) */}
      <Route path="/login" element={<Login />} />

      {/* Página principal Home */}
      <Route path="/home" element={<Home />} />

      {/* Garante que qualquer rota de Usuários monte a Home e carregue o conteúdo dentro dela */}
      <Route path="/usuarios/*" element={<Home />} />

      {/* Fallback opcional para rotas desconhecidas */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

// Exporta o componente App
export default App
