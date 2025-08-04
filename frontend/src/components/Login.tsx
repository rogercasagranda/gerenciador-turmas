// frontend/src/components/Login.tsx

import React, { useState } from 'react';
import '../styles/Login.css';
import ErrorPopup from './ErrorPopup';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha.trim()) {
      setMensagemErro('SEU USUÁRIO E/OU SENHA ESTÃO INCORRETOS, TENTE NOVAMENTE');
      setErro(true);
      return;
    }

    alert(`Login realizado!\nUsuário: ${usuario}`);
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setMensagemErro('Token do Google não recebido');
      setErro(true);
      return;
    }

    try {
      await axios.post('http://localhost:8000/auth/google', {
        token: credentialResponse.credential,
      });
      navigate('/home');
    } catch {
      setMensagemErro('Falha na autenticação com Google');
      setErro(true);
    }
  };

  const handleGoogleError = () => {
    setMensagemErro('Falha na autenticação com Google');
    setErro(true);
  };

  const fecharPopup = () => setErro(false);

  return (
    <div className="login-wrapper">
      <div className="login-background">
        <div className="login-container">
          <form className="login-box" onSubmit={handleSubmit} autoComplete="off">
            <input
              type="text"
              className="login-input"
              placeholder="Usuário"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              autoComplete="username"
              required
            />
            <input
              type="password"
              className="login-input"
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="submit" className="login-button">
              Entrar
            </button>
            <div className="login-google-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                auto_select
                clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as unknown as string}
              />
            </div>
          </form>
        </div>
      </div>
      {erro && (
        <ErrorPopup mensagem={mensagemErro} onClose={fecharPopup} />
      )}
    </div>
  );
};

export default Login;
