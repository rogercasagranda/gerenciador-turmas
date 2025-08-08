// Importa bibliotecas do React e do roteador
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Importa páginas
import Login from './components/Login'
import Home from './pages/Home/Home'
import CadastrarUsuario from './pages/Usuarios/CadastrarUsuario'
import ConsultarUsuario from './pages/Usuarios/ConsultarUsuario'

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

      {/* Rotas protegidas embutidas dentro da Home */}
      <Route path="/usuarios/cadastrar" element={<Home />} />
      <Route path="/usuarios/consultar" element={<Home />} />
    </Routes>
  )
}

// Exporta o componente App
export default App
