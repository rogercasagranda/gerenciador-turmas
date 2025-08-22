// Importa bibliotecas do React e do roteador
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Importa páginas
import LoginPageWrapper from './pages/Login/LoginPageWrapper'
import Home from './pages/Home/Home'
import OAuthOk from './pages/OAuthOk'

import PoliticaDeCookies from './pages/PoliticaDeCookies'
import PrivateRoute from './router/PrivateRoute'
import routesConfig from './routes/routesConfig'


// Componente principal da aplicação
const App: React.FC = () => {
  return (
    <Routes>
      {/* Redireciona a raiz para a tela de login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Tela de login (layout travado) */}
      <Route path="/login" element={<LoginPageWrapper />} />
      <Route path="/oauth-ok" element={<OAuthOk />} />

      {/* Política de Cookies */}
      <Route path="/politica-de-cookies" element={<PoliticaDeCookies />} />


      {/* Página principal Home */}
      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />

      {/* Rotas de cadastro; montam a Home para exibir conteúdo interno */}
      <Route path="/cadastro/*" element={<PrivateRoute><Home /></PrivateRoute>} />

      {/* Rotas de configuração definidas no arquivo de rotas */}
      {routesConfig.map((r) => (
        <Route key={r.path} path={r.path} element={<PrivateRoute><Home /></PrivateRoute>} />
      ))}

      {/* Página de acesso negado */}
      <Route path="/403" element={<PrivateRoute><Home /></PrivateRoute>} />

      {/* Fallback opcional para rotas desconhecidas */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

// Exporta o componente App
export default App
