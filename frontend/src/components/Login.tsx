import '../styles/Login.css'
import '../styles/Login.lock.css'
// Importa os hooks necessários do React
import React, { useState, useEffect } from "react";

// Importa o hook de navegação com suporte a BASE_URL
import useBaseNavigate from '@/hooks/useBaseNavigate'

// Base da API e utilidades de autenticação
import { API_BASE, getAuthToken, setAuthToken, authFetch } from "@/services/api";
import { syncThemePreference } from '@/services/themePreferences'

// Importa o arquivo CSS da tela de login
import "../styles/Login.css";

// Componente funcional Login
const Login: React.FC = () => {
  // Estado do campo de usuário
  const [username, setUsername] = useState("");

  // Estado do campo de senha
  const [password, setPassword] = useState("");

  // Controle de exibição do popup de erro
  const [showPopup, setShowPopup] = useState(false);
  // Estado para mensagem dinâmica do popup
  const [popupMessage, setPopupMessage] = useState("SEU USUÁRIO E/OU SENHA ESTÃO INCORRETAS, TENTE NOVAMENTE");

  // Contador regressivo do popup de erro
  const [countdown, setCountdown] = useState(5);

  // Estado do checkbox "Continuar conectado"
  const [keepConnected, setKeepConnected] = useState(false);

  // Hook de navegação
  const navigate = useBaseNavigate();

  // Redireciona para Home se já houver token armazenado
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      console.log('[auth] token presente, redirecionando para /home')
      navigate('/home');
    }
  }, [navigate]);


  // Verifica se veio err=USER_NOT_FOUND na URL (fluxo Google)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('err');
    if (err === 'USER_NOT_FOUND') {
      setPopupMessage('Cadastro não encontrado, procure a secretaria da sua escola');
      setShowPopup(true);
      setCountdown(5);
      // Remove o parâmetro da URL sem recarregar
      const url = new URL(window.location.href);
      url.searchParams.delete('err');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);



  // Envia dados para o backend ao submeter o formulário
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Previne comportamento padrão

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST", // Método POST
        headers: {
          "Content-Type": "application/json", // Tipo do conteúdo
        },
        body: JSON.stringify({
          usuario: username,
          senha: password,
        }),
      });

      // Se falhar, exibe o popup
      if (!response.ok) {
        if (response.status === 403) {
          try {
            const data = await response.json();
            if (data && (data.code === 'USER_NOT_FOUND' || data?.detail?.code === 'USER_NOT_FOUND')) {
              setPopupMessage('Cadastro não encontrado, procure a secretaria da sua escola');
            }
          } catch {}
        }
        setShowPopup(true);
        setCountdown(5);
        return;
      }

      // Se sucesso, armazena token e consulta permissões antes de seguir
      try {
        const data = await response.json();
        const token = data.token || data.access_token;
        if (token) {
          setAuthToken(token, keepConnected);
          try {
            const res = await authFetch('/me/permissions/effective');
            if (res.ok) {
              const perms = await res.json();
              try {
                localStorage.setItem('permissions.effective', JSON.stringify(perms.permissions));
              } catch {}
              window.dispatchEvent(new Event('permissions:updated'));
            }
          } catch {}
          await syncThemePreference();
        }
      } catch {}
      navigate('/home');
    } catch (error) {
      // Exibe erro
      console.error("Erro ao fazer login:", error);
      setShowPopup(true);
      setCountdown(5);
    }
  };

  // Redireciona para o login do Google
  const handleGoogleLogin = () => {
    const persist = keepConnected ? "1" : "0";
    sessionStorage.setItem("login:persist", persist);
    window.location.href = `${API_BASE}/google-login`;
  };

  // Controla o temporizador do popup
  useEffect(() => {
    if (showPopup && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }

    if (countdown === 0) {
      setShowPopup(false);
      window.location.reload();
    }
  }, [showPopup, countdown]);

  // Renderiza o conteúdo da tela
  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        {/* Título */}
        <h2>Portal do Professor</h2>

        {/* Campo usuário */}
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Campo senha */}
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Botão de login */}
        <button type="submit" className="button">Entrar</button>

        {/* Checkbox e texto alinhados */}
        <div className="keep-connected">
          <label className="keep-connected-label">
            <input
              type="checkbox"
              checked={keepConnected}
              onChange={(e) => setKeepConnected(e.target.checked)}
            />
            <span>Continuar conectado</span>
          </label>
        </div>

        {/* Botão do Google funcional */}
        <button type="button" className="button google-button" onClick={handleGoogleLogin}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
          />
          <span>Fazer Login com o Google</span>
        </button>
      </form>

      {/* Popup de erro com botão e contador */}
      {showPopup && (
        <div className="popup-erro">
          <p>{popupMessage}</p>
          <button className="button" onClick={() => window.location.reload()}>Fechar</button>
          <span className="contador">{countdown} segundos</span>
        </div>
      )}
    </div>
  );
};

// Exporta o componente Login
export default Login;
