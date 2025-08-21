// Importa bibliotecas do React e do roteador
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Importa páginas
import LoginPageWrapper from './pages/Login/LoginPageWrapper'
import Home from './pages/Home/Home'

import PoliticaDeCookies from './pages/PoliticaDeCookies'
import RouteGuard from './routes/RouteGuard'


// Componente principal da aplicação
const App: React.FC = () => {
  return (
    <Routes>
      {/* Redireciona a raiz para a tela de login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Tela de login (layout travado) */}
      <Route path="/login" element={<LoginPageWrapper />} />

      {/* Política de Cookies */}
      <Route path="/politica-de-cookies" element={<PoliticaDeCookies />} />


      {/* Página principal Home */}
      <Route path="/home" element={<RouteGuard><Home /></RouteGuard>} />

      {/* Rotas de cadastro; montam a Home para exibir conteúdo interno */}
      <Route path="/cadastro/*" element={<RouteGuard><Home /></RouteGuard>} />

      {/* Garante que qualquer rota de Usuários monte a Home e carregue o conteúdo dentro dela */}
      <Route path="/usuarios/*" element={<RouteGuard><Home /></RouteGuard>} />

      {/* Rotas de configuração */}
      <Route path="/config/*" element={<RouteGuard><Home /></RouteGuard>} />

      {/* Página institucional: Política de Cookies */}
      <Route path="/politica-de-cookies" element={<PoliticaDeCookies />} />

      {/* Fallback opcional para rotas desconhecidas */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

// Exporta o componente App
export default App
