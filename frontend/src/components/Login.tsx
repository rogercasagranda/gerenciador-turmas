// frontend/src/components/Login.tsx

import React, { useState } from 'react';
import '../styles/Login.css';
import ErrorPopup from './ErrorPopup';

const Login: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  // Validação do formulário e popup de erro
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha.trim()) {
      setMensagemErro('SEU USUÁRIO E/OU SENHA ESTÃO INCORRETAS, TENTE NOVAMENTE');
      setErro(true);
      return;
    }
    alert(`Login realizado!\nUsuário: ${usuario}`);
  };

  // Botão Google: só mostra popup por enquanto
  const handleGoogle = () => {
    setMensagemErro('Funcionalidade de login com Google em desenvolvimento!');
    setErro(true);
  };

  // Fecha popup de erro
  const fecharPopup = () => setErro(false);

  return (
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
          <button
            type="button"
            className="login-google-button"
            onClick={handleGoogle}
          >
            <span className="login-google-icon">
              {/* G clássico estilizado, cor roxa padrão Portal do Professor */}
              <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                 <g>
                    <path fill="#4285F4" d="M43.6 20.5h-1.8V20H24v8h11.2c-1.1 3-4.1 5.1-7.2 5.1a8 8 0 1 1 0-16c1.9 0 3.6.7 5 1.8l6-5.8A16.1 16.1 0 1 0 24 40c7.8 0 14.6-5.6 15.9-13a13.2 13.2 0 0 0 .3-2.5c0-1-.1-2-.2-3z"/>
                    <path fill="#34A853" d="M6.3 14.1a20 20 0 0 1 27.8-6.1l6.6-6.4A28.3 28.3 0 0 0 4 24a28.2 28.2 0 0 0 5.1 15.9l7-7.2a20 20 0 0 1-4.8-12.6z"/>
                    <path fill="#FBBC05" d="M24 44a20 20 0 0 0 14-5.2l-7-7.2A12.9 12.9 0 0 1 24 36a12.9 12.9 0 0 1-9.2-3.6l-7 7.2A20 20 0 0 0 24 44z"/>
                    <path fill="#EA4335" d="M43.6 20.5h-1.8V20H24v8h11.2c-1.1 3-4.1 5.1-7.2 5.1a8 8 0 1 1 0-16c1.9 0 3.6.7 5 1.8l6-5.8A16.1 16.1 0 1 0 24 40c7.8 0 14.6-5.6 15.9-13a13.2 13.2 0 0 0 .3-2.5c0-1-.1-2-.2-3z"/>
                 </g>
              </svg>
            </span>
            Fazer Login com o Google
          </button>
        </form>
        {erro && (
          <ErrorPopup mensagem={mensagemErro} onClose={fecharPopup} />
        )}
      </div>
    </div>
  );
};

export default Login;
