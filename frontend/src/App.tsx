// frontend/src/App.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './pages/Home/Home';
import CadastrarUsuario from './pages/Usuarios/CadastrarUsuario';
import ConsultarUsuario from './pages/Usuarios/ConsultarUsuario';

const isAutenticado = () => {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  return !!usuarioLogado;
};

const RotaPrivada = ({ children }: { children: JSX.Element }) => {
  return isAutenticado() ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<RotaPrivada><Home /></RotaPrivada>} />
      <Route path="/usuarios/cadastrar" element={<RotaPrivada><CadastrarUsuario /></RotaPrivada>} />
      <Route path="/usuarios/consultar" element={<RotaPrivada><ConsultarUsuario /></RotaPrivada>} />
    </Routes>
  );
};

export default App;
